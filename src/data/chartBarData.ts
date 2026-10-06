export interface ChartBarDataPoint {
  category: string;
  value: number;
}

export interface ChartBarSeries {
  name: string;
  data: number[];
}

// Data dummy untuk bar chart sesuai gambar 5
// Kategori: Navigation, Form, Button, Feedback, Data Display, Charts
export const chartBarCategories = [
  'Navigation',
  'Form',
  'Button',
  'Feedback',
  'Data Display',
  'Charts',
];

// Data dummy untuk setiap kategori (dalam multiplier x)
export const generateChartBarData = (): ChartBarDataPoint[] => {
  return [
    { category: 'Navigation', value: 5.3 },
    { category: 'Form', value: 3.8 },
    { category: 'Button', value: 6.5 },
    { category: 'Feedback', value: 4.1 },
    { category: 'Data Display', value: 5.3 },
    { category: 'Charts', value: 2.3 },
  ];
};

export const defaultChartBarData = generateChartBarData();

// Filter data berdasarkan periode waktu (untuk ButtonGroup)
export function filterChartBarDataByPeriod(
  data: ChartBarDataPoint[],
  period: '1-tahun' | '1-bulan' | '7-hari',
): ChartBarDataPoint[] {
  // Untuk sekarang, return data yang sama (bisa di-extend nanti dengan data real per periode)
  // Ini hanya untuk demo, data sebenarnya akan berbeda per periode
  const multipliers: Record<string, number> = {
    '1-tahun': 1.0,
    '1-bulan': 0.8,
    '7-hari': 0.5,
  };

  const multiplier = multipliers[period] || 1.0;

  return data.map((point) => ({
    ...point,
    value: Math.round(point.value * multiplier * 10) / 10, // Round to 1 decimal
  }));
}
