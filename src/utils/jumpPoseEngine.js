/**
 * Jumps Real-Time Pose Detection Engine
 * Measures 2D Relative Vertical Displacement (Inches Equivalent)
 * with hysteresis state locking to prevent double counting.
 */

/**
 * Process Pose Keypoints for Jumps Test
 * @param {Object} poseLandmarks - Detected keypoint landmarks
 * @param {string} currentState - 'GROUNDED' | 'AIRBORNE'
 * @param {number} currentJumpCount - Current completed jump count
 * @param {number} baselineY - Baseline ground Y coordinate
 * @param {number} currentPeak - Peak displacement recorded in current jump
 * @returns {Object} { newJumpCount, newState, newBaselineY, newPeak, currentDisplacementInches, formStatus, isJumpIncremented }
 */
export function processJumpPose(poseLandmarks, currentState = 'GROUNDED', currentJumpCount = 0, baselineY = null, currentPeak = 0) {
  const hip = poseLandmarks?.left_hip || poseLandmarks?.leftHip || poseLandmarks?.hip;
  const ankle = poseLandmarks?.left_ankle || poseLandmarks?.leftAnkle || poseLandmarks?.ankle;

  if (!hip && !ankle) {
    return {
      newJumpCount: currentJumpCount,
      newState: currentState,
      newBaselineY: baselineY,
      newPeak: currentPeak,
      currentDisplacementInches: 0,
      formStatus: 'ALIGN BODY WITH CAMERA',
      isJumpIncremented: false
    };
  }

  // Use Hip Y coordinate (or Ankle Y coordinate) for vertical displacement
  const currentY = hip ? hip.y : ankle.y;

  // Initialize or smooth baseline ground Y coordinate
  let newBaselineY = baselineY;
  if (newBaselineY === null) {
    newBaselineY = currentY;
  }

  // In 2D image coordinates, smaller Y values represent higher vertical positions (upward movement)
  const verticalDelta = newBaselineY - currentY; // Positive value means airborne elevation

  // Scale 2D pixel delta to estimated 2D Relative Displacement Inches Equivalent
  // (Standard normalization factor: 1 pixel ~ 0.5 inches)
  const currentDisplacementInches = Math.max(0, parseFloat((verticalDelta * 0.5).toFixed(1)));

  let newState = currentState;
  let newJumpCount = currentJumpCount;
  let newPeak = currentPeak;
  let formStatus = 'GROUNDED (STANCE)';
  let isJumpIncremented = false;

  // Thresholds for hysteresis state locking:
  // Airborne threshold: displacement >= 12 inches equivalent
  // Grounded threshold: displacement <= 4 inches equivalent
  const AIRBORNE_THRESHOLD = 12;
  const GROUNDED_THRESHOLD = 4;

  if (currentState === 'GROUNDED') {
    // Slowly update baseline Y when grounded to handle posture drift
    newBaselineY = Math.round(newBaselineY * 0.8 + currentY * 0.2);

    if (currentDisplacementInches >= AIRBORNE_THRESHOLD) {
      newState = 'AIRBORNE';
      newPeak = currentDisplacementInches;
      formStatus = 'AIRBORNE - ELEVATION PEAK!';
    } else {
      formStatus = 'STATE: GROUNDED (READY TO JUMP)';
    }
  } else if (currentState === 'AIRBORNE') {
    // Track maximum peak elevation during jump
    if (currentDisplacementInches > newPeak) {
      newPeak = currentDisplacementInches;
    }

    if (currentDisplacementInches <= GROUNDED_THRESHOLD) {
      newState = 'GROUNDED';
      newJumpCount = currentJumpCount + 1;
      isJumpIncremented = true;
      formStatus = `JUMP ${newJumpCount} LANDED! (PEAK: ${newPeak} in)`;
    } else {
      formStatus = `AIRBORNE (PEAK: ${newPeak} in)`;
    }
  }

  return {
    newJumpCount,
    newState,
    newBaselineY,
    newPeak,
    currentDisplacementInches,
    formStatus,
    isJumpIncremented
  };
}
