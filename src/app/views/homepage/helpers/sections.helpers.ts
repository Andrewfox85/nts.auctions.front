import { ALL_SECTIONS_ID, ALL_SECTIONS_TEXT } from '../constants';
import { ISession, Section } from '../interfaces';

export function mapSessionToSection(session: ISession): Section {
  return {
    name: session.sectionName,
    id: session.sectionId,
  };
}

export function uniqueSections(sections: Section[]): Section[] {
  const unique = new Map<number, Section>();
  sections.forEach((item) => unique.set(item.id, item));
  return Array.from(unique.values());
}

export function addAllSectionsOption(sections: Section[]): Section[] {
  if (sections.length > 1) {
    return [{ name: ALL_SECTIONS_TEXT, id: ALL_SECTIONS_ID }, ...sections];
  }
  return sections;
}
