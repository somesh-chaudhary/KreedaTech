import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { Camera, useCameraDevice, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';
import { Worklets } from 'react-native-worklets-core';
import { detectPose } from 'vision-camera-pose-detector';
import { processSitupPose } from '../utils/situpPoseEngine';
import { processJumpPose } from '../utils/jumpPoseEngine';
import { processDashPose } from '../utils/dashPoseEngine';
import { processConePose } from '../utils/conePoseEngine';
import { fetchWithFallback } from '../config/api';

const theme = {
  colors: {
    background: '#F4F6F9',
    card: '#FFFFFF',
    text: '#1D2C3B',
    textSecondary: '#6B7A8B',
    primary: '#2E7D32',
    primaryLight: '#4CAF50',
    danger: '#DC3545',
    border: '#EAECEF',
    statGreen: '#2E7D32',
    statBgGreen: '#E8F5E9',
    white: '#FFFFFF',
  },
  spacing: { s: 8, m: 16, l: 24 },
  typography: {
    h1: { fontSize: 20, fontWeight: 'bold' },
    h2: { fontSize: 18, fontWeight: 'bold' },
    body: { fontSize: 16, color: '#1D2C3B', lineHeight: 24 },
    caption: { fontSize: 14, color: '#6B7A8B' },
  },
  borderRadius: { m: 16, l: 24 },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 5,
  },
};

const COMPOSITE_STAGES = ['Situps', 'Jumps', '40-Yard Dash', 'Cone Drill'];

const LiveTestScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const selectedTestType = route?.params?.testType || route?.params?.testName || 'Complete Athletic Assessment';
  const isCompositeAssessment = selectedTestType === 'Complete Athletic Assessment';

  // Multi-stage Composite Assessment Index: 0 to 3
  const [compositeStageIndex, setCompositeStageIndex] = useState(0);
  const [compositeStageResults, setCompositeStageResults] = useState([]);

  // Active Test Type for current stage or single test
  const activeTestType = isCompositeAssessment ? COMPOSITE_STAGES[compositeStageIndex] : selectedTestType;

  // Camera & Permissions
  const { hasPermission, requestPermission } = useCameraPermission();
  const backDevice = useCameraDevice('back');
  const frontDevice = useCameraDevice('front');
  const [useFrontCamera, setUseFrontCamera] = useState(false);
  const device = useFrontCamera ? (frontDevice || backDevice) : (backDevice || frontDevice);

  // Real-time ML Detection State
  const [poseDetected, setPoseDetected] = useState(false);
  const [landmarkCount, setLandmarkCount] = useState(0);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);

  // Test Execution States: 'IDLE' | 'COUNTDOWN' | 'ACTIVE' | 'SUBMITTING' | 'STAGE_RESULT' | 'RESULT' | 'ERROR'
  const [testState, setTestState] = useState('IDLE');
  const [countdown, setCountdown] = useState(3);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Sit-up Pose Tracking States
  const [situpState, setSitupState] = useState('DOWN');
  const [repCount, setRepCount] = useState(0);
  const [currentHipAngle, setCurrentHipAngle] = useState(165);

  // Jumps Pose Tracking States
  const [jumpState, setJumpState] = useState('GROUNDED');
  const [jumpCount, setJumpCount] = useState(0);
  const [currentDisplacementInches, setCurrentDisplacementInches] = useState(0);
  const [peakDisplacementInches, setPeakDisplacementInches] = useState(0);

  // 40-Yard Dash Optical Sprint Timer States
  const [dashState, setDashState] = useState('READY');
  const [sprintDuration, setSprintDuration] = useState(0);

  // Cone Drill Pose & Agility Directional States
  const [coneState, setConeState] = useState('READY');
  const [turnCount, setTurnCount] = useState(0);
  const [coneDrillDuration, setConeDrillDuration] = useState(0);

  const [formStatus, setFormStatus] = useState('Align full body in camera frame');
  const [submittedResult, setSubmittedResult] = useState(null);
  const [lastStageResult, setLastStageResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const timerRef = useRef(null);
  const situpStateRef = useRef('DOWN');
  const repCountRef = useRef(0);
  const jumpStateRef = useRef('GROUNDED');
  const jumpCountRef = useRef(0);
  const jumpBaselineYRef = useRef(null);
  const jumpPeakRef = useRef(0);
  const dashStateRef = useRef('READY');
  const dashStartMsRef = useRef(0);
  const coneStateRef = useRef('READY');
  const coneTurnsRef = useRef(0);
  const coneStartMsRef = useRef(0);

  // Real ML Frame Processing Callback (dispatches from worklet to JS thread)
  const onPoseDetectedJS = Worklets.createRunOnJS((landmarks) => {
    if (!landmarks || typeof landmarks !== 'object' || Object.keys(landmarks).length === 0) {
      setPoseDetected(false);
      setLandmarkCount(0);
      return;
    }

    const count = Object.keys(landmarks).length;
    setPoseDetected(true);
    setLandmarkCount(count);

    if (activeTestType === 'Situps') {
      const hip = landmarks.leftHip || landmarks.rightHip;
      const shoulder = landmarks.leftShoulder || landmarks.rightShoulder;
      const knee = landmarks.leftKnee || landmarks.rightKnee;
      if (hip && shoulder && knee) {
        const keypoints = { shoulder, hip, knee };
        const poseRes = processSitupPose(keypoints, situpStateRef.current, repCountRef.current);
        situpStateRef.current = poseRes.newState;
        repCountRef.current = poseRes.newRepCount;
        setSitupState(poseRes.newState);
        setRepCount(poseRes.newRepCount);
        if (poseRes.currentHipAngle) setCurrentHipAngle(Math.round(poseRes.currentHipAngle));
        setFormStatus(poseRes.formStatus);
      }
    } else if (activeTestType === 'Jumps') {
      const hip = landmarks.leftHip || landmarks.rightHip;
      const ankle = landmarks.leftAnkle || landmarks.rightAnkle;
      if (hip && ankle) {
        const keypoints = { hip, ankle };
        const jumpRes = processJumpPose(keypoints, jumpStateRef.current, jumpCountRef.current, jumpBaselineYRef.current, jumpPeakRef.current);
        jumpStateRef.current = jumpRes.newState;
        jumpCountRef.current = jumpRes.newJumpCount;
        jumpBaselineYRef.current = jumpRes.newBaselineY;
        jumpPeakRef.current = jumpRes.newPeak;
        setJumpState(jumpRes.newState);
        setJumpCount(jumpRes.newJumpCount);
        setCurrentDisplacementInches(jumpRes.currentDisplacementInches);
        setPeakDisplacementInches(jumpRes.newPeak || 0);
        setFormStatus(jumpRes.formStatus);
      }
    } else if (activeTestType === '40-Yard Dash') {
      const shoulder = landmarks.leftShoulder || landmarks.rightShoulder;
      const hip = landmarks.leftHip || landmarks.rightHip;
      if (shoulder && hip) {
        const keypoints = { shoulder, hip };
        const currentMs = Date.now();
        const dashRes = processDashPose(keypoints, dashStateRef.current, dashStartMsRef.current, currentMs, 100);
        dashStateRef.current = dashRes.newState;
        setDashState(dashRes.newState);
        if (dashRes.sprintDurationSeconds) setSprintDuration(dashRes.sprintDurationSeconds);
        setFormStatus(dashRes.formStatus);
      }
    } else if (activeTestType === 'Cone Drill') {
      const hip = landmarks.leftHip || landmarks.rightHip;
      const ankle = landmarks.leftAnkle || landmarks.rightAnkle;
      if (hip && ankle) {
        const keypoints = { hip, ankle };
        const currentMs = Date.now();
        const coneRes = processConePose(keypoints, coneStateRef.current, coneTurnsRef.current, coneStartMsRef.current, currentMs);
        coneStateRef.current = coneRes.newState;
        coneTurnsRef.current = coneRes.newTurns;
        setConeState(coneRes.newState);
        setTurnCount(coneRes.newTurns);
        if (coneRes.drillDurationSeconds) setConeDrillDuration(coneRes.drillDurationSeconds);
        setFormStatus(coneRes.formStatus);
      }
    }
  });

  // Camera Frame Processor Hook
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const pose = detectPose(frame);
    onPoseDetectedJS(pose);
  }, [activeTestType]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Handle Countdown
  useEffect(() => {
    if (testState === 'COUNTDOWN') {
      setCountdown(3);
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            startActiveTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [testState]);

  const startActiveTest = () => {
    setTestState('ACTIVE');
    setElapsedSeconds(0);
    setRepCount(0);
    setJumpCount(0);
    setSprintDuration(0);
    setTurnCount(0);
    setConeDrillDuration(0);
    setFormStatus('No movement detected - Position full body in frame');

    situpStateRef.current = 'DOWN';
    repCountRef.current = 0;
    jumpStateRef.current = 'GROUNDED';
    jumpCountRef.current = 0;
    jumpBaselineYRef.current = 0;
    jumpPeakRef.current = 0;
    dashStateRef.current = 'READY';
    dashStartMsRef.current = Date.now();
    coneStateRef.current = 'READY';
    coneTurnsRef.current = 0;
    coneStartMsRef.current = Date.now();

    // Pure elapsed seconds timer without fake mock telemetry injections
    timerRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
  };

  const handleToggleTest = () => {
    if (testState === 'IDLE' || testState === 'RESULT') {
      if (!hasPermission) {
        requestPermission().then(granted => setTestState('COUNTDOWN'));
      } else {
        setTestState('COUNTDOWN');
      }
    } else if (testState === 'ACTIVE') {
      finishTestAndSubmit();
    }
  };

  const finishTestAndSubmit = async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    const duration = elapsedSeconds || 0;
    const finalReps = activeTestType === 'Situps' ? repCountRef.current : null;
    const finalJumpDisplacement = activeTestType === 'Jumps' ? jumpPeakRef.current : null;
    const finalSprintTime = activeTestType === '40-Yard Dash' ? sprintDuration : null;
    const finalConeTime = activeTestType === 'Cone Drill' ? coneDrillDuration : null;

    // Check if any genuine exercise movement was detected
    const hasValidMovement = (
      (activeTestType === 'Situps' && finalReps > 0) ||
      (activeTestType === 'Jumps' && finalJumpDisplacement > 0) ||
      (activeTestType === '40-Yard Dash' && finalSprintTime > 0) ||
      (activeTestType === 'Cone Drill' && finalConeTime > 0)
    );

    let stageScore = 0;
    let stageMetric = '0';

    if (!hasValidMovement) {
      stageScore = 0;
      stageMetric = 'No valid movement detected';
    } else if (activeTestType === 'Situps') {
      stageScore = Math.max(0, Math.min(990, Math.round(400 + (finalReps * 9))));
      stageMetric = `${finalReps} reps`;
    } else if (activeTestType === 'Jumps') {
      stageScore = Math.max(0, Math.min(990, Math.round(550 + (finalJumpDisplacement * 12))));
      stageMetric = `${finalJumpDisplacement} in`;
    } else if (activeTestType === '40-Yard Dash') {
      stageScore = Math.max(0, Math.min(990, Math.round(1100 - (finalSprintTime * 50))));
      stageMetric = `${finalSprintTime}s`;
    } else if (activeTestType === 'Cone Drill') {
      stageScore = Math.max(0, Math.min(980, Math.round(1100 - (finalConeTime * 45))));
      stageMetric = `${finalConeTime}s`;
    }

    const currentStageObj = {
      testType: activeTestType,
      score: stageScore,
      rawMetric: stageMetric,
      hasValidMovement
    };

    const updatedStageResults = [...compositeStageResults, currentStageObj];
    setCompositeStageResults(updatedStageResults);

    // If part of multi-stage Composite Assessment and not on final stage
    if (isCompositeAssessment && compositeStageIndex < COMPOSITE_STAGES.length - 1) {
      setLastStageResult(currentStageObj);
      setTestState('STAGE_RESULT');
      return;
    }

    // FINAL STAGE OR SINGLE TEST: SUBMIT RECORD TO BACKEND
    setTestState('SUBMITTING');

    let finalCompositeScore = stageScore;
    let finalRawValue = stageMetric;
    let payloadTestType = selectedTestType;

    if (isCompositeAssessment) {
      const validStages = updatedStageResults.filter(r => r.hasValidMovement);
      if (validStages.length === 0) {
        finalCompositeScore = 0;
      } else {
        const sum = updatedStageResults.reduce((acc, r) => acc + (r.score || 0), 0);
        finalCompositeScore = Math.round(sum / COMPOSITE_STAGES.length);
      }

      finalRawValue = updatedStageResults
        .map(r => `${r.testType}: ${r.rawMetric} (${r.score})`)
        .join(' | ');

      payloadTestType = 'Complete Athletic Assessment';
    }

    const percentageScore = parseFloat((finalCompositeScore / 10).toFixed(1));
    const xpEarned = Math.round(finalCompositeScore * 0.35);

    let category = 'Incomplete';
    if (finalCompositeScore >= 900) category = 'Elite';
    else if (finalCompositeScore >= 800) category = 'Advanced';
    else if (finalCompositeScore >= 600) category = 'Intermediate';
    else if (finalCompositeScore > 0) category = 'Beginner';

    const payload = {
      userId: 'usr_0001',
      athleteName: 'Priya Sharma',
      testType: payloadTestType,
      score: finalCompositeScore,
      percentageScore: percentageScore,
      rawPerformanceValue: finalRawValue,
      repetitions: finalReps,
      durationSeconds: duration,
      xpEarned: xpEarned,
      performanceCategory: category,
      date: new Date().toISOString().split('T')[0]
    };

    // Only submit to backend if actual valid exercise movement was performed
    if (finalCompositeScore > 0) {
      try {
        const res = await fetchWithFallback('/api/tests/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();

        if (res.status === 201 || res.status === 200) {
          setSubmittedResult(json.data || payload);
          setTestState('RESULT');
        } else {
          setErrorMessage(json.error || 'Failed to submit test result');
          setTestState('ERROR');
        }
      } catch (err) {
        console.log('Error submitting test result to API:', err.message);
        setSubmittedResult(payload);
        setTestState('RESULT');
      }
    } else {
      setSubmittedResult(payload);
      setTestState('RESULT');
    }
  };

  const handleNextStage = () => {
    setCompositeStageIndex(prev => prev + 1);
    setTestState('IDLE');
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      {/* --- FIXED HEADER --- */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FeatherIcon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{activeTestType}</Text>
          <Text style={styles.headerSubtitle}>
            {isCompositeAssessment ? `Stage ${compositeStageIndex + 1} of 4: ${activeTestType}` : 'Real-Time Pose Assessment'}
          </Text>
        </View>
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{formatTimer(elapsedSeconds)}</Text>
          <Text style={[styles.timerStatus, { color: testState === 'ACTIVE' ? theme.colors.danger : theme.colors.primary }]}>
            {testState === 'ACTIVE' ? 'LIVE' : 'Ready'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* --- INTERMEDIATE STAGE RESULT VIEW (COMPOSITE FLOW) --- */}
        {testState === 'STAGE_RESULT' && lastStageResult && (
          <View style={[styles.card, styles.resultCard, theme.shadow]}>
            <View style={styles.resultBadgeContainer}>
              <FeatherIcon name="check-circle" size={48} color={theme.colors.primary} />
              <Text style={styles.resultTitle}>Stage {compositeStageIndex + 1} Complete!</Text>
              <Text style={styles.resultSubtitle}>{lastStageResult.testType}</Text>
            </View>

            <View style={styles.scoreRow}>
              <View style={styles.scoreMetricItem}>
                <Text style={styles.scoreMetricValue}>{lastStageResult.score}</Text>
                <Text style={styles.scoreMetricLabel}>Score</Text>
              </View>
              <View style={styles.scoreMetricItem}>
                <Text style={styles.scoreMetricValue}>{lastStageResult.rawMetric}</Text>
                <Text style={styles.scoreMetricLabel}>Measured Metric</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.homeButton} onPress={handleNextStage}>
              <Text style={styles.homeButtonText}>
                Continue to Stage {compositeStageIndex + 2}: {COMPOSITE_STAGES[compositeStageIndex + 1]}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* --- FINAL COMPOSITE OR SINGLE RESULT VIEW --- */}
        {testState === 'RESULT' && submittedResult ? (
          <View style={[styles.card, styles.resultCard, theme.shadow]}>
            <View style={styles.resultBadgeContainer}>
              <FeatherIcon name="award" size={48} color={theme.colors.primary} />
              <Text style={styles.resultTitle}>
                {isCompositeAssessment ? 'Complete Assessment Passed!' : 'Test Completed!'}
              </Text>
              <Text style={styles.resultSubtitle}>{submittedResult.testType}</Text>
            </View>

            <View style={styles.scoreRow}>
              <View style={styles.scoreMetricItem}>
                <Text style={styles.scoreMetricValue}>{submittedResult.score}</Text>
                <Text style={styles.scoreMetricLabel}>Overall Score</Text>
              </View>
              <View style={styles.scoreMetricItem}>
                <Text style={styles.scoreMetricValue}>{submittedResult.percentageScore}%</Text>
                <Text style={styles.scoreMetricLabel}>Percentage</Text>
              </View>
              <View style={styles.scoreMetricItem}>
                <Text style={styles.scoreMetricValue}>+{submittedResult.xpEarned}</Text>
                <Text style={styles.scoreMetricLabel}>XP Earned</Text>
              </View>
            </View>

            {/* Individual Sub-Test Breakdown Table for Composite Assessment */}
            {isCompositeAssessment && compositeStageResults.length > 0 && (
              <View style={styles.breakdownContainer}>
                <Text style={styles.breakdownTitle}>Assessment Breakdown (25% Weight Each)</Text>
                {compositeStageResults.map((r, i) => (
                  <View key={i} style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>{r.testType}</Text>
                    <Text style={styles.breakdownMetric}>{r.rawMetric}</Text>
                    <Text style={styles.breakdownScore}>{r.score} pts</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>Rating: {submittedResult.performanceCategory}</Text>
            </View>

            <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.homeButtonText}>Return to Home</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Leaderboard')}>
              <Text style={styles.secondaryButtonText}>View Live Leaderboard</Text>
            </TouchableOpacity>
          </View>
        ) : testState !== 'STAGE_RESULT' ? (
          <>
            {/* --- Progress & Telemetry Card --- */}
            <View style={[styles.card, theme.shadow]}>
              <View style={styles.progressHeader}>
                <Text style={styles.cardTitle}>{activeTestType} Status</Text>
                <Text style={styles.progressFraction}>
                  {isCompositeAssessment ? `Stage ${compositeStageIndex + 1}/4` : testState}
                </Text>
              </View>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: isCompositeAssessment
                        ? `${((compositeStageIndex + 1) / 4) * 100}%`
                        : (testState === 'ACTIVE' ? '100%' : (testState === 'COUNTDOWN' ? '33%' : '10%'))
                    }
                  ]}
                />
              </View>

              {/* Explicit 3-State Diagnostic HUD */}
              <View style={styles.hudRow}>
                <View style={styles.hudBox}>
                  <Text style={[styles.hudValue, { fontSize: 13, color: hasPermission ? theme.colors.statGreen : theme.colors.danger }]}>
                    {hasPermission ? 'ACTIVE' : 'NO PERM'}
                  </Text>
                  <Text style={styles.hudLabel}>CAMERA FEED</Text>
                </View>
                <View style={styles.hudBox}>
                  <Text style={[styles.hudValue, { fontSize: 13, color: poseDetected ? theme.colors.statGreen : '#FFA000' }]}>
                    {poseDetected ? `POSE (${landmarkCount})` : 'READY / NO POSE'}
                  </Text>
                  <Text style={styles.hudLabel}>ML DETECTOR</Text>
                </View>
                <View style={styles.hudBox}>
                  <Text style={[styles.hudValue, { fontSize: 13, color: (repCount > 0 || peakDisplacementInches > 0 || sprintDuration > 0 || turnCount > 0) ? theme.colors.primary : theme.colors.textSecondary }]}>
                    {(repCount > 0 || peakDisplacementInches > 0 || sprintDuration > 0 || turnCount > 0) ? 'ACTIVE' : '0 PTS'}
                  </Text>
                  <Text style={styles.hudLabel}>LIVE SCORING</Text>
                </View>
              </View>
            </View>

            {/* --- Vision Camera Feed Container --- */}
            <View style={[styles.card, styles.cameraCard]}>
              {hasPermission && device ? (
                <Camera
                  style={StyleSheet.absoluteFill}
                  device={device}
                  isActive={testState !== 'RESULT'}
                  frameProcessor={frameProcessor}
                  enableZoomGesture={true}
                />
              ) : null}

              {testState === 'COUNTDOWN' ? (
                <View style={styles.overlayContainer}>
                  <Text style={styles.countdownNumber}>{countdown}</Text>
                  <Text style={styles.overlaySubtitle}>Get Ready For {activeTestType}...</Text>
                </View>
              ) : testState === 'SUBMITTING' ? (
                <View style={styles.overlayContainer}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.overlaySubtitle}>Calculating Composite Assessment Score...</Text>
                </View>
              ) : (
                <View style={styles.cameraViewport}>
                  <View style={styles.cameraGridFrame} />

                  {(!hasPermission || !device) && (
                    <>
                      <FeatherIcon name="camera" size={40} color="rgba(255, 255, 255, 0.8)" />
                      <Text style={styles.cameraText}>{activeTestType} Stream Active</Text>
                    </>
                  )}

                  {/* Form Status HUD Pill */}
                  <View style={styles.formStatusPill}>
                    <FeatherIcon name="info" size={14} color="#FFCC00" style={{ marginRight: 6 }} />
                    <Text style={styles.formStatusPillText}>{formStatus}</Text>
                  </View>

                  <View style={styles.statusPill}>
                    <View style={[styles.statusDot, { backgroundColor: testState === 'ACTIVE' ? '#FF3B30' : '#4CD964' }]} />
                    <Text style={styles.statusPillText}>
                      {testState === 'ACTIVE' ? 'LIVE CAMERA STREAM ACTIVE' : 'CAMERA PREVIEW READY'}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* --- Position Setup Card --- */}
            <View style={[styles.card, theme.shadow]}>
              <Text style={styles.cardTitle}>Assessment Stage Setup</Text>
              <Text style={styles.instructionsText}>
                {activeTestType === 'Cone Drill'
                  ? 'Position camera at side angle. Sprint outbound to turnaround cone, then return to finish cone.'
                  : (activeTestType === '40-Yard Dash'
                    ? 'Set 3-point crouch stance at start line. Sprint past camera optical finish gate.'
                    : (activeTestType === 'Jumps'
                      ? 'Stand 5-7 feet from camera with full body and feet visible.'
                      : 'Lie sideways to camera so shoulder, hip, and knee are clearly tracked.'))}
              </Text>
              <Text style={styles.recommendationText}>
                Mode: <Text style={{ fontWeight: 'bold' }}>Multi-Test Composite Assessment Pipeline</Text>
              </Text>
            </View>
          </>
        ) : null}
      </ScrollView>

      {/* --- BOTTOM RECORD BAR --- */}
      {testState !== 'RESULT' && testState !== 'STAGE_RESULT' && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
          <TouchableOpacity
            style={[styles.recordButton, { backgroundColor: testState === 'ACTIVE' ? theme.colors.primary : theme.colors.danger }]}
            onPress={handleToggleTest}
            disabled={testState === 'COUNTDOWN' || testState === 'SUBMITTING'}
          >
            <FeatherIcon name={testState === 'ACTIVE' ? 'square' : 'video'} size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.bottomBarText}>
            {testState === 'ACTIVE'
              ? `Tap to finish ${activeTestType} stage`
              : `Tap red button to start ${activeTestType} stage`}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.m, paddingBottom: theme.spacing.s, backgroundColor: theme.colors.card, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { ...theme.typography.h1 },
  headerSubtitle: { ...theme.typography.caption },
  timerContainer: { alignItems: 'flex-end' },
  timerText: { ...theme.typography.h1 },
  timerStatus: { ...theme.typography.caption, fontWeight: 'bold' },
  scrollContent: { padding: theme.spacing.m, paddingBottom: 150 },
  card: { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.m, padding: theme.spacing.m, marginBottom: theme.spacing.m },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { ...theme.typography.h2 },
  progressFraction: { ...theme.typography.caption, fontWeight: 'bold' },
  progressBarBackground: { height: 8, borderRadius: 4, backgroundColor: theme.colors.border, marginVertical: theme.spacing.s, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 4 },
  hudRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.colors.border },
  hudBox: { alignItems: 'center', width: '31%' },
  hudValue: { fontSize: 18, fontWeight: 'bold', color: theme.colors.text },
  hudLabel: { fontSize: 10, color: theme.colors.textSecondary, marginTop: 2, fontWeight: '600' },
  cameraCard: { height: 270, backgroundColor: '#1A252C', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderRadius: 20 },
  cameraViewport: { alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' },
  cameraGridFrame: { position: 'absolute', width: '85%', height: '80%', borderWidth: 2, borderColor: 'rgba(76, 175, 80, 0.7)', borderStyle: 'dashed', borderRadius: 16, zIndex: 10 },
  cameraText: { color: 'rgba(255, 255, 255, 0.9)', marginTop: theme.spacing.s, fontWeight: '600', zIndex: 10 },
  formStatusPill: { position: 'absolute', top: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.75)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, zIndex: 15 },
  formStatusPillText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  statusPill: { position: 'absolute', bottom: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.65)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, zIndex: 15 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusPillText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  overlayContainer: { justifyContent: 'center', alignItems: 'center', zIndex: 20 },
  countdownNumber: { fontSize: 72, fontWeight: 'bold', color: '#FFFFFF' },
  overlaySubtitle: { color: '#FFFFFF', fontSize: 16, marginTop: 8 },
  instructionsText: { ...theme.typography.body, marginVertical: theme.spacing.s },
  recommendationText: { ...theme.typography.caption },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, alignItems: 'center', backgroundColor: theme.colors.card, borderTopWidth: 1, borderTopColor: theme.colors.border },
  recordButton: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: theme.spacing.s, ...theme.shadow },
  bottomBarText: { ...theme.typography.caption, fontWeight: '500' },
  resultCard: { alignItems: 'center', padding: theme.spacing.l },
  resultBadgeContainer: { alignItems: 'center', marginBottom: theme.spacing.l },
  resultTitle: { ...theme.typography.h1, fontSize: 22, marginTop: theme.spacing.s, textAlign: 'center' },
  resultSubtitle: { ...theme.typography.caption, fontSize: 15 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginVertical: theme.spacing.l },
  scoreMetricItem: { alignItems: 'center' },
  scoreMetricValue: { ...theme.typography.h1, fontSize: 24, color: theme.colors.primary },
  scoreMetricLabel: { ...theme.typography.caption, marginTop: 4 },
  breakdownContainer: { width: '100%', backgroundColor: theme.colors.background, padding: 12, borderRadius: theme.borderRadius.m, marginBottom: theme.spacing.m },
  breakdownTitle: { ...theme.typography.caption, fontWeight: 'bold', marginBottom: 8, color: theme.colors.text },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  breakdownLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
  breakdownMetric: { fontSize: 12, color: theme.colors.textSecondary },
  breakdownScore: { fontSize: 13, fontWeight: 'bold', color: theme.colors.primary },
  categoryBadge: { backgroundColor: theme.colors.statBgGreen, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: theme.spacing.l },
  categoryBadgeText: { color: theme.colors.statGreen, fontWeight: 'bold', fontSize: 14 },
  homeButton: { backgroundColor: theme.colors.primary, width: '100%', paddingVertical: 14, borderRadius: theme.borderRadius.m, alignItems: 'center', marginBottom: 10 },
  homeButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
  secondaryButton: { borderWidth: 1, borderColor: theme.colors.border, width: '100%', paddingVertical: 14, borderRadius: theme.borderRadius.m, alignItems: 'center' },
  secondaryButtonText: { color: theme.colors.text, fontWeight: '600', fontSize: 16 },
});

export default LiveTestScreen;