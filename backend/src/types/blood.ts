/**
 * Blood group enum and compatibility matrix.
 * This is the single source of truth for all blood group logic in the system.
 */

export enum BloodGroup {
  A_POS = 'A+',
  A_NEG = 'A-',
  B_POS = 'B+',
  B_NEG = 'B-',
  AB_POS = 'AB+',
  AB_NEG = 'AB-',
  O_POS = 'O+',
  O_NEG = 'O-',
}

/** All valid blood group string values */
export const BLOOD_GROUPS = Object.values(BloodGroup);

/**
 * Blood group compatibility matrix.
 * Key: donor blood group → Value: array of recipient blood groups the donor can give to.
 */
export const COMPATIBILITY: Record<BloodGroup, BloodGroup[]> = {
  [BloodGroup.O_NEG]: [
    BloodGroup.O_NEG, BloodGroup.O_POS,
    BloodGroup.A_NEG, BloodGroup.A_POS,
    BloodGroup.B_NEG, BloodGroup.B_POS,
    BloodGroup.AB_NEG, BloodGroup.AB_POS,
  ],
  [BloodGroup.O_POS]: [
    BloodGroup.O_POS, BloodGroup.A_POS,
    BloodGroup.B_POS, BloodGroup.AB_POS,
  ],
  [BloodGroup.A_NEG]: [
    BloodGroup.A_NEG, BloodGroup.A_POS,
    BloodGroup.AB_NEG, BloodGroup.AB_POS,
  ],
  [BloodGroup.A_POS]: [BloodGroup.A_POS, BloodGroup.AB_POS],
  [BloodGroup.B_NEG]: [
    BloodGroup.B_NEG, BloodGroup.B_POS,
    BloodGroup.AB_NEG, BloodGroup.AB_POS,
  ],
  [BloodGroup.B_POS]: [BloodGroup.B_POS, BloodGroup.AB_POS],
  [BloodGroup.AB_NEG]: [BloodGroup.AB_NEG, BloodGroup.AB_POS],
  [BloodGroup.AB_POS]: [BloodGroup.AB_POS],
};

/**
 * Given a requested (recipient) blood group, returns the list of
 * donor blood groups that are compatible (can donate to that recipient).
 */
export function getCompatibleDonorGroups(requestedGroup: BloodGroup): BloodGroup[] {
  return BLOOD_GROUPS.filter((donorGroup) =>
    COMPATIBILITY[donorGroup as BloodGroup].includes(requestedGroup)
  );
}
