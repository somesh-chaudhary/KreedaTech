/**
 * Sit-up Real-Time Pose Detection Engine
 * Uses keypoint angle calculation (Shoulder -> Hip -> Knee)
 * with hysteresis state locking to prevent double counting.
 */

/**
 * Calculates angle between three 2D keypoints (A: Shoulder, B: Hip, C: Knee)
 * @param {Object} pA - { x, y }
 * @param {Object} pB - { x, y }
 * @param {Object} pC - { x, y }
 * @returns {number} Angle in degrees [0, 180]
 */
export function calculateJointAngle(pA, pB, pC) {
  if (!pA || !pB || !pC) return 180;

  const radians = Math.atan2(pC.y - pB.y, pC.x - pB.x) - Math.atan2(pA.y - pB.y, pA.x - pB.x);
  let degrees = Math.abs((radians * 180.0) / Math.PI);

  if (degrees > 180.0) {
    degrees = 360.0 - degrees;
  }
  return Math.round(degrees);
}

/**
 * Process Pose Keypoints for Sit-ups Test
 * @param {Object} poseLandmarks - Detected keypoint landmarks
 * @param {string} currentState - 'DOWN' | 'UP'
 * @param {number} currentReps - Current repetition count
 * @returns {Object} { newRepCount, newState, hipAngle, formStatus, isRepIncremented }
 */
export function processSitupPose(poseLandmarks, currentState = 'DOWN', currentReps = 0) {
  // Standard COCO / ML Kit / MediaPipe Keypoints
  const shoulder = poseLandmarks?.left_shoulder || poseLandmarks?.leftShoulder || poseLandmarks?.shoulder;
  const hip = poseLandmarks?.left_hip || poseLandmarks?.leftHip || poseLandmarks?.hip;
  const knee = poseLandmarks?.left_knee || poseLandmarks?.leftKnee || poseLandmarks?.knee;

  if (!shoulder || !hip || !knee) {
    return {
      newRepCount: currentReps,
      newState: currentState,
      hipAngle: 180,
      formStatus: 'ALIGN BODY WITH CAMERA',
      isRepIncremented: false
    };
  }

  const hipAngle = calculateJointAngle(shoulder, hip, knee);

  let newState = currentState;
  let newRepCount = currentReps;
  let formStatus = 'GOOD FORM';
  let isRepIncremented = false;

  // Thresholds: DOWN >= 135 deg, UP <= 70 deg
  if (currentState === 'DOWN') {
    if (hipAngle <= 75) {
      newState = 'UP';
      formStatus = 'UP POSITION (PEAK)';
    } else {
      formStatus = 'POSITION: DOWN (LYING FLAT)';
    }
  } else if (currentState === 'UP') {
    if (hipAngle >= 130) {
      newState = 'DOWN';
      newRepCount = currentReps + 1;
      isRepIncremented = true;
      formStatus = `REP ${newRepCount} COMPLETED!`;
    } else {
      formStatus = 'POSITION: UP (RETURN DOWN)';
    }
  }

  return {
    newRepCount,
    newState,
    hipAngle,
    formStatus,
    isRepIncremented
  };
}
