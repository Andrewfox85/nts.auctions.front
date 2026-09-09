import { IDisplaySession } from '../interfaces';

export const filterSessionsForDisplay = (
  formatedSessions: IDisplaySession[],
  selectedSectionId: number,
  ALL_SECTIONS_ID: number
): IDisplaySession[] => {
  return selectedSectionId === ALL_SECTIONS_ID
    ? formatedSessions
    : formatedSessions.filter(
        (session) => session.sectionId === selectedSectionId
      );
};
