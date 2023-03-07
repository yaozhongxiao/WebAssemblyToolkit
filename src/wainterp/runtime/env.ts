
type ImportObject = Object;
type Key = string;
type Visitor = (arg0:Key, arg1:Key, val:any) => void;

function walk(object: ImportObject, visitor: Visitor) {
  Object.keys(object).forEach((key) => {
    Object.keys(object[key]).forEach((key2) => {
      const val = object[key][key2];

      visitor(key, key2, val);
    });
  });
}

export default {walk}