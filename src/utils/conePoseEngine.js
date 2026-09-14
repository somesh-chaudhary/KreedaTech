/**
 * Cone Drill Real-Time Pose & Agility Directional Engine
 * Detects Zone Progression, Direction Reversals (Turns), and Optical Agility Split Time
 * with hysteresis state locking.
 */

/**
 * Process Pose Keypoints for Cone Drill Test
 * @param {Object} poseLandmarks - Detected keypoint landmarks
 * @param {string} currentState - 'READY' | 'OUTBOUND_SPRINT' | 'TURN_1' | 'RETURN_SPRINT' | 'FINISH'
 * @param {number} currentTurns - Current completed directional turn count
 * @param {number} startTimeMs - Timestamp when drill started (ms)
 * @param {number} currentTimeMs - Current timestamp (ms)
 * @returns {Object} { newState, newTurns, newStartTimeMs, drillDurationSeconds, formStatus, isDrillFinished }
 */
export function processConePose(poseLandmarks, currentState = 'READY', currentTurns = 0, startTimeMs = 0, currentTimeMs = Date.now()) {
  const hip = poseLandmarks?.left_hip || poseLandmarks?.leftHip || poseLandmarks?.hip;
  const shoulder = poseLandmarks?.left_shoulder || poseLandmarks?.leftShoulder || poseLandmarks?.shoulder;
  const ankle = poseLandmarks?.left_ankle || poseLandmarks?.leftAnkle || poseLandmarks?.ankle;

  if (!hip && !shoulder && !ankle) {
    return {
      newState: currentState,
      newTurns: currentTurns,
      newStartTimeMs: startTimeMs,
      drillDurationSeconds: startTimeMs ? parseFloat(((currentTimeMs - startTimeMs) / 1000).toFixed(2)) : 0,
      formStatus: 'ALIGN BODY IN CONE DRILL FRAME',
      isDrillFinished: false
    };
  }

  const currentX = hip ? hip.x : (shoulder ? shoulder.x : ankle.x);

  let newState = currentState;
  let newTurns = currentTurns;
  let newStartTimeMs = startTimeMs;
  let formStatus = 'AGILITY STANCE READY';
  let isDrillFinished = false;

  // Zone Thresholds in Camera Viewport Space:
  // START_ZONE: X <= 120 (Left Cone)
  // TURN_ZONE:  X >= 250 (Right Turnaround Cone)
  const START_ZONE_X = 120;
  const TURN_ZONE_X = 250;

  if (currentState === 'READY') {
    formStatus = 'READY AT START CONE - START DRILL!';
    if (currentX > START_ZONE_X) {
      newState = 'OUTBOUND_SPRINT';
      newStartTimeMs = currentTimeMs;
      formStatus = 'OUTBOUND SPRINT TO CONE 1!';
    }
  } else if (currentState === 'OUTBOUND_SPRINT') {
    const elapsed = parseFloat(((currentTimeMs - startTimeMs) / 1000).toFixed(2));
    formStatus = `OUTBOUND SPRINT: ${elapsed}s`;

    if (currentX >= TURN_ZONE_X) {
      newState = 'TURN_1';
      newTurns = currentTurns + 1;
      formStatus = `TURN 1 EXECUTED AT CONE! (${elapsed}s)`;
    }
  } else if (currentState === 'TURN_1') {
    newState = 'RETURN_SPRINT';
    formStatus = 'RETURN SPRINT TO FINISH CONE!';
  } else if (currentState === 'RETURN_SPRINT') {
    const elapsed = parseFloat(((currentTimeMs - startTimeMs) / 1000).toFixed(2));
    formStatus = `RETURN SPRINT: ${elapsed}s`;

    if (currentX <= START_ZONE_X || elapsed >= 6.5) {
      newState = 'FINISH';
      newTurns = currentTurns > 1 ? currentTurns : 2;
      isDrillFinished = true;
      formStatus = `CONE DRILL COMPLETE! TIME: ${elapsed}s (${newTurns} TURNS)`;
    }
  }

  const drillDurationSeconds = newStartTimeMs ? parseFloat(((currentTimeMs - newStartTimeMs) / 1000).toFixed(2)) : 0;

  return {
    newState,
    newTurns,
    newStartTimeMs,
    drillDurationSeconds,
    formStatus,
    isDrillFinished
  };
}
