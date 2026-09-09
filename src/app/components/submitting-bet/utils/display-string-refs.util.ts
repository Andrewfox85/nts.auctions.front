import { RefsValue, DisplayRefs } from './../interfaces';


export function makeChoosenRefs(
  values: RefsValue[]
): DisplayRefs[] {
  return values.map(
    (prop) => ({
      idReference: prop.idReference,
      referenceName: prop.nameReference,
      value: prop.nameValue,
      isIconShow: false,
    })
  );
}
