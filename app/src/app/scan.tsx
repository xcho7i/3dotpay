import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { Header } from '../components/Header';
import { Screen } from '../components/Screen';
import { LoadingState } from '../components/StateView';
import { decodeQr } from '../lib/api';
import { useAuth } from '../lib/privy/hooks';
import { colors, radius, spacing } from '../lib/theme';

type Phase = 'scanning' | 'decoding' | 'error';

export default function QRScannerScreen() {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>('scanning');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const handledRef = useRef(false);

  const reset = () => {
    handledRef.current = false;
    setErrorMsg(null);
    setPhase('scanning');
  };

  const onScanned = async ({ data }: { data: string }) => {
    // Duplicate-scan guard: ignore further frames once one is being handled.
    if (handledRef.current || !data) return;
    handledRef.current = true;
    setPhase('decoding');
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');
      const decoded = await decodeQr(token, data);
      router.replace({
        pathname: '/quote',
        params: {
          merchantId: decoded.merchantId,
          merchantName: decoded.merchantName ?? '',
          amount: decoded.amount ?? '',
          currency: decoded.currency,
          requiresAmount: decoded.requiresAmount ? '1' : '0',
          rawPayload: decoded.rawPayload,
        },
      });
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Could not read this QR code');
      setPhase('error');
    }
  };

  if (!permission) {
    return (
      <Screen>
        <Header title="Scan to pay" />
        <LoadingState label="Checking camera…" />
      </Screen>
    );
  }

  if (!permission.granted) {
    return (
      <Screen>
        <Header title="Scan to pay" />
        <View style={styles.denied}>
          <Text style={styles.deniedIcon}>📷</Text>
          <Text style={styles.deniedTitle}>Camera access needed</Text>
          <Text style={styles.deniedText}>
            3DotPay uses your camera to scan PromptPay QR codes. No images are stored.
          </Text>
          <Button
            title={permission.canAskAgain ? 'Allow camera' : 'Open settings'}
            onPress={() => void requestPermission()}
            style={styles.deniedBtn}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <View style={styles.headerWrap}>
        <Header title="Scan to pay" />
      </View>
      <View style={styles.cameraWrap}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          // Only listen while actively scanning — pauses during decode/error.
          onBarcodeScanned={phase === 'scanning' ? onScanned : undefined}
        />

        <View style={[styles.reticle, phase === 'error' && styles.reticleError]} />

        {phase === 'scanning' ? <Text style={styles.hint}>Point at a PromptPay QR</Text> : null}

        {phase === 'decoding' ? (
          <View style={styles.overlay}>
            <ActivityIndicator color={colors.text} size="large" />
            <Text style={styles.overlayText}>Reading QR…</Text>
          </View>
        ) : null}

        {phase === 'error' ? (
          <View style={styles.overlay}>
            <Text style={styles.errorTitle}>Can't read this QR</Text>
            <Text style={styles.overlayText}>{errorMsg}</Text>
            <Button title="Scan again" onPress={reset} style={styles.scanAgain} />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerWrap: { padding: spacing.lg, paddingBottom: spacing.sm },
  cameraWrap: { flex: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  reticle: { width: 240, height: 240, borderWidth: 3, borderColor: colors.primary, borderRadius: radius.lg },
  reticleError: { borderColor: colors.danger },
  hint: {
    position: 'absolute',
    bottom: 48,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    backgroundColor: colors.overlay,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  overlayText: { color: colors.text, fontSize: 15, textAlign: 'center' },
  errorTitle: { color: colors.danger, fontSize: 20, fontWeight: '800' },
  scanAgain: { alignSelf: 'stretch', marginTop: spacing.sm },
  denied: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg },
  deniedIcon: { fontSize: 40 },
  deniedTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  deniedText: { color: colors.subtext, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  deniedBtn: { alignSelf: 'stretch', marginTop: spacing.md },
});
