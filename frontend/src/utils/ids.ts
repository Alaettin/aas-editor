export function generateId(): string {
  return crypto.randomUUID();
}

export function generateUrn(prefix: string): string {
  return `urn:aas-editor:${prefix}:${generateId()}`;
}
