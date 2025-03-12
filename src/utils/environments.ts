
export interface Environment {
  label: string;
  baseUrl: string;
}

export const environments: Environment[] = [
  { label: 'Production', baseUrl: 'https://web.gamebench.net' },
  { label: 'QA (v2-30-0)', baseUrl: 'https://gb-v2-30-0.qa.gbdev.tech' },
];

export const getApiUrl = (baseUrl: string) => {
  // Remove trailing slash if present
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  return `${cleanBaseUrl}/v1`;
};
