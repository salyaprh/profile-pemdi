export interface DashboardTableRowNew {
  id: string;
  name: string;
  fullName: string;
  nameSubtext?: string;
  logo?: string;
  progress: number; // 0-100
  status: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Kurang';
  estimasiEfisiensi: string; // Format: "Rp1.500.000.000"
}

// Helper function to create a data URI SVG logo
const createLogoImage = (text: string, color: string) => {
  const svg = `<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="24" fill="${color}"/>
    <text x="50%" y="50%" font-family="Inter, sans-serif" font-size="14" font-weight="600" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">${text}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(encodeURIComponent(svg).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))))}`;
};

// Generate dummy data sesuai design
const generateTableData = (): DashboardTableRowNew[] => {
  const instansi = [
    { name: 'Badan Kepegawaian Negara', short: 'BKN', color: '#EF4444' },
    { name: 'Kementerian Keuangan', short: 'KEU', color: '#3B82F6' },
    {
      name: 'Kementerian Pekerjaan Umum dan Perumahan Rakyat',
      short: 'PUPR',
      color: '#EF4444',
    },
    { name: 'Kementerian Dalam Negeri', short: 'DNR', color: '#F59E0B' },
    {
      name: 'Kementerian Lingkungan Hidup dan Kehutanan',
      short: 'KLHK',
      color: '#10B981',
    },
    {
      name: 'Kementerian Pendidikan dan Kebudayaan',
      short: 'DIK',
      color: '#8B5CF6',
    },
    { name: 'Kementerian Kesehatan', short: 'KES', color: '#EC4899' },
    { name: 'Kementerian Perhubungan', short: 'HUB', color: '#06B6D4' },
    { name: 'Kementerian Perindustrian', short: 'RIN', color: '#F97316' },
    { name: 'Kementerian Perdagangan', short: 'DAG', color: '#6366F1' },
  ];

  const statuses: DashboardTableRowNew['status'][] = [
    'Sangat Baik',
    'Baik',
    'Cukup',
    'Kurang',
  ];
  const progressValues = [85, 75, 45, 19, 80, 60, 35, 90, 55, 25];
  const estimasiValues = [
    'Rp1.500.000.000',
    'Rp1.500.000.000',
    'Rp2.000.000.000',
    'Rp3.500.000.000',
    'Rp5.500.000.000',
    'Rp2.200.000.000',
    'Rp1.800.000.000',
    'Rp4.000.000.000',
    'Rp2.500.000.000',
    'Rp1.200.000.000',
  ];

  return Array.from({ length: 100 }, (_, index) => {
    const instansiData = instansi[index % instansi.length];
    const progress = progressValues[index % progressValues.length];
    const status = statuses[index % statuses.length];
    const estimasi = estimasiValues[index % estimasiValues.length];
    const logo = createLogoImage(instansiData.short, instansiData.color);

    return {
      id: `instansi-${index + 1}`,
      fullName: instansiData.name,
      name:
        instansiData.name.length > 20
          ? instansiData.name.substring(0, 20) + '...'
          : instansiData.name,
      nameSubtext:
        index % 3 === 0
          ? 'Deskripsi data'
          : 'Ini adalah deskripsi dari instansi ' + instansiData.name,
      logo,
      progress,
      status,
      estimasiEfisiensi: estimasi,
    };
  });
};

export const allTableDataNew: DashboardTableRowNew[] = generateTableData();

// Fetch function untuk Table component
export interface FetchParams {
  page: number;
  pageSize: number;
  sortField: string | null;
  sortOrder: 'asc' | 'desc' | null;
  searchTerm: string;
}

export interface FetchResult {
  data: DashboardTableRowNew[];
  total: number;
}

export async function fetchDashboardTableDataNew(
  params: FetchParams & {
    statusFilter?: string | null;
    progressFilter?: string | null;
    instansiFilter?: string | null;
  },
): Promise<FetchResult> {
  const {
    page,
    pageSize,
    sortField,
    sortOrder,
    searchTerm,
    statusFilter,
    progressFilter,
    instansiFilter,
  } = params;

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  let filteredData = [...allTableDataNew];

  // Apply search filter (by name)
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    filteredData = filteredData.filter((row) =>
      row.name.toLowerCase().includes(searchLower),
    );
  }

  // Apply status filter
  if (statusFilter && statusFilter !== 'all') {
    filteredData = filteredData.filter((row) => row.status === statusFilter);
  }

  // Apply progress filter (range-based)
  if (progressFilter && progressFilter !== 'all') {
    const progressRanges: Record<string, { min: number; max: number }> = {
      '0-25': { min: 0, max: 25 },
      '26-50': { min: 26, max: 50 },
      '51-75': { min: 51, max: 75 },
      '76-100': { min: 76, max: 100 },
    };
    const range = progressRanges[progressFilter];
    if (range) {
      filteredData = filteredData.filter(
        (row) => row.progress >= range.min && row.progress <= range.max,
      );
    }
  }

  // Apply instansi filter (by name)
  if (instansiFilter && instansiFilter !== 'all') {
    filteredData = filteredData.filter((row) =>
      row.fullName.includes(instansiFilter),
    );
  }

  // Apply sorting
  if (sortField && sortOrder) {
    filteredData.sort((a, b) => {
      const aValue = a[sortField as keyof DashboardTableRowNew];
      const bValue = b[sortField as keyof DashboardTableRowNew];

      if (aValue === undefined || bValue === undefined) return 0;

      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  // Apply pagination
  const total = filteredData.length;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    total,
  };
}

export const statusFilterOptions = [
  // { label: 'Semua Status', value: 'all' },
  { label: 'Sangat Baik', value: 'Sangat Baik' },
  { label: 'Baik', value: 'Baik' },
  { label: 'Cukup', value: 'Cukup' },
  { label: 'Kurang', value: 'Kurang' },
];

export const progressFilterOptions = [
  // { label: 'Semua Progress', value: 'all' },
  { label: '0-25%', value: '0-25' },
  { label: '26-50%', value: '26-50' },
  { label: '51-75%', value: '51-75' },
  { label: '76-100%', value: '76-100' },
];

export const instansiFilterOptions = [
  // { label: 'Semua Instansi', value: 'all' },
  { label: 'Badan Kepegawaian Negara', value: 'Badan Kepegawaian Negara' },
  { label: 'Kementerian Keuangan', value: 'Kementerian Keuangan' },
  { label: 'Kementerian Pekerjaan Umum', value: 'Kementerian Pekerjaan Umum' },
  { label: 'Kementerian Dalam Negeri', value: 'Kementerian Dalam Negeri' },
  {
    label: 'Kementerian Lingkungan Hidup',
    value: 'Kementerian Lingkungan Hidup',
  },
  { label: 'Kementerian Pendidikan', value: 'Kementerian Pendidikan' },
  { label: 'Kementerian Kesehatan', value: 'Kementerian Kesehatan' },
  { label: 'Kementerian Perhubungan', value: 'Kementerian Perhubungan' },
  { label: 'Kementerian Perindustrian', value: 'Kementerian Perindustrian' },
  { label: 'Kementerian Perdagangan', value: 'Kementerian Perdagangan' },
];
