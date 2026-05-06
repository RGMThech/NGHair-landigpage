export type PwdRule = { key: string; label: string; test: (p: string) => boolean };

export const passwordRules: PwdRule[] = [
  { key: "len", label: "Mínimo 8 caracteres", test: (p) => p.length >= 8 },
  { key: "upper", label: "Pelo menos 1 letra maiúscula (A-Z)", test: (p) => /[A-Z]/.test(p) },
  { key: "lower", label: "Pelo menos 1 letra minúscula (a-z)", test: (p) => /[a-z]/.test(p) },
  { key: "num", label: "Pelo menos 1 número (0-9)", test: (p) => /\d/.test(p) },
  { key: "special", label: "Pelo menos 1 caractere especial (!@#$%...)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export const validatePassword = (p: string) => passwordRules.every((r) => r.test(p));