export interface DashboardMetric {
  label: string;
  value: string;
  subtitle: string;
  icon: string;
  iconColor: string;
}

export const dashboardMetrics: DashboardMetric[] = [
  {
    label: 'Komponen Digunakan',
    value: '128',
    subtitle: '12 komponen ditambahkan bulan ini',
    icon: 'package',
    iconColor: 'orange',
  },
  {
    label: 'Halaman Teradopsi',
    value: '342',
    subtitle: '45 halaman diperbarui',
    icon: 'document',
    iconColor: 'blue',
  },
  {
    label: 'Konsistensi Desain',
    value: '92%',
    subtitle: '3% dibanding periode sebelumnya',
    icon: 'check-square',
    iconColor: 'green',
  },
];
