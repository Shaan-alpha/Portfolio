// Literal identifiers in the copy are set as code, so `send: false` reads as
// the return value it is rather than as prose.
const CODE = /(send: false|kill -9|RESOURCE_LIMITS|\/makeshort)/g;

export function withCode(text: string) {
  return text.split(CODE).map((part, i) => (i % 2 ? <code key={i}>{part}</code> : part));
}
