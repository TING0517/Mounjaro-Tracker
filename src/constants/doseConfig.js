export const PEN_TYPES = [
  { value: '5', label: '5mg (總20mg)' },
  { value: '10', label: '10mg (總40mg)' },
  { value: '15', label: '15mg (總60mg)' }
];

export const INJECTION_SITES = [
  '左腹', '右腹', '左大腿', '右大腿', '左臂', '右臂'
];

// Returns clicks for a given pen type and dose
export const calculateClicks = (penType, dose) => {
  const p = Number(penType);
  const d = Number(dose);
  
  if (p === 5) {
    if (d === 2.5) return 30;
    if (d === 5) return 60;
  }
  if (p === 10) {
    if (d === 2.5) return 15;
    if (d === 5) return 30;
    if (d === 7.5) return 45;
    if (d === 10) return 60;
  }
  if (p === 15) {
    if (d === 2.5) return 10;
    if (d === 5) return 20;
    if (d === 7.5) return 30;
    if (d === 10) return 40;
    if (d === 12.5) return 50;
    if (d === 15) return 60;
  }
  return 0; // fallback
};

export const getAvailableDoses = (penType) => {
  const p = Number(penType);
  if (p === 5) return [2.5, 5];
  if (p === 10) return [2.5, 5, 7.5, 10];
  if (p === 15) return [2.5, 5, 7.5, 10, 12.5, 15];
  return [];
};

// Each pen has a base total dose, and a leftover dose equivalent to 1 dose
export const getPenDetails = (penType) => {
  const type = Number(penType);
  if (type === 5) return { baseTotal: 20, leftover: 5 };
  if (type === 10) return { baseTotal: 40, leftover: 10 };
  if (type === 15) return { baseTotal: 60, leftover: 15 };
  return { baseTotal: 0, leftover: 0 };
};
