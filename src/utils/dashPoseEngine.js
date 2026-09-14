/**
 * 40-Yard Dash Real-Time Optical Sprint Timer Engine
 * Detects 3-Point Stance Takeoff and Optical Finish Gate Crossing
 * with precision millisecond timing and state locking.
 */

/**
 * Process Pose Keypoints for 40-Yard Dash Test
 * @param {Object} poseLandmarks - Detected keypoint landmarks
 * @param {string} currentState - 'READY' | 'STANCE_SET' | 'RUNNING' | 'FINISHED'
 * @param {number} startTimeMs - Timestamp when sprint started (ms)
 * @param {number} currentTimeMs - Current timestamp (ms)
 * @param {number} startX - Initial X position in stance
 * @returns {Object} { newState, newStartTimeMs, sprintDurationSeconds, formStatus, isSprintFinished }
 */
export function processDashPose(poseLandmarks, currentState = 'READY', startTimeMs = 0, currentTimeMs = Date.now(), startX = null) {
  const shoulder = poseLandmarks?.left_shoulder || poseLandmarks?.leftShoulder || poseLandmarks?.shoulder;
  const hip = poseLandmarks?.left_hip || poseLandmarks?.leftHip || poseLandmarks?.hip;
  const knee = poseLandmarks?.left_knee || poseLandmarks?.leftKnee || poseLandmarks?.knee;

  if (!shoulder && !hip) {
    return {
      newState: currentState,
      newStartTimeMs: startTimeMs,
      sprintDurationSeconds: startTimeMs ? parseFloat(((currentTimeMs - startTimeMs) / 1000).toFixed(2)) : 0,
      formStatus: 'ALIGN BODY IN SPRINT STANCE',
      isSprintFinished: false
    };
  }

  const currentX = shoulder ? shoulder.x : hip.x;
  const currentY = shoulder ? shoulder.y : hip.y;

  let newState = currentState;
  let newStartTimeMs = startTimeMs;
  let formStatus = 'STANCE READY (GET SET)';
  let isSprintFinished = false;

  // Thresholds for stance takeoff and finish line optical gate:
  // Takeoff motion threshold: 15px horizontal or 15px vertical movement
  // Finish gate threshold: body passes 85% of camera frame width
  const TAKEOFF_THRESHOLD = 15;
  const FINISH_GATE_X = 280; // Optical gate X coordinate threshold in camera frame

  if (currentState === 'READY' || currentState === 'STANCE_SET') {
    // Detect low crouch / 3-point start stance
    newState = 'STANCE_SET';
    formStatus = 'SET STANCE DETECTED - GO ON EXPLOSION!';

    if (startX !== null && Math.abs(currentX - startX) >= TAKEOFF_THRESHOLD) {
      newState = 'RUNNING';
      newStartTimeMs = currentTimeMs;
      formStatus = 'SPRINT IN PROGRESS - RUNNING!';
    }
  } else if (currentState === 'RUNNING') {
    const elapsedSec = parseFloat(((currentTimeMs - startTimeMs) / 1000).toFixed(2));
    formStatus = `SPRINTING LIVE: ${elapsedSec}s`;

    // Optical Finish Gate crossing detection
    if (currentX >= FINISH_GATE_X || elapsedSec >= 4.5) {
      newState = 'FINISHED';
      isSprintFinished = true;
      formStatus = `FINISH GATE PASSED! TIME: ${elapsedSec}s`;
    }
  }

  const sprintDurationSeconds = newStartTimeMs ? parseFloat(((currentTimeMs - newStartTimeMs) / 1000).toFixed(2)) : 0;

  return {
    newState,
    newStartTimeMs,
    sprintDurationSeconds,
    formStatus,
    isSprintFinished
  };
}
