import { useState } from 'react';
import { Badge, TextField } from '@idds/react';
import { IconPlus, IconSearch, IconUsers } from '@tabler/icons-react';
import ButtonLink from '../../components/ButtonLink';
import EmptyState from '../../components/EmptyState';
import FilterChips from '../../components/FilterChips';
import PaginationNav from '../../components/PaginationNav';
import { formatDateTime } from '../../lib/format';
import { Link, navigate, paths, useLocation } from '../../lib/router';
import { usePageMeta } from '../../lib/seo';
import { DataTable, HeaderCell } from '../components/Table';
import LoadError from '../components/LoadError';
import { useUsers, type UserListFilters, type UserStatusFilter } from '../users/api';

const STATUS_OPTIONS: { label: string; value: UserStatusFilter }[] = [
  { label: 'Semua', value: 'semua' },
  { label: 'Aktif', value: 'aktif' },
  { label: 'Nonaktif', value: 'nonaktif' },
];

function readFilters(searchParams: URLSearchParams): UserListFilters {
  const status = searchParams.get('status');
  const halaman = Math.floor(Number(searchParams.get('halaman')));
  return {
    status: status === 'aktif' || status === 'nonaktif' ? status : 'semua',
    cari: searchParams.get('cari') ?? '',
    halaman: halaman > 1 ? halaman : 1,
  };
}

function usersUrl({ status, cari, halaman }: UserListFilters): string {
  const params = new URLSearchParams();
  if (status !== 'semua') params.set('status', status);
  if (cari.trim()) params.set('cari', cari.trim());
  if (halaman > 1) params.set('halaman', String(halaman));
  const query = params.toString();
  return query ? `${paths.adminUsers}?${query}` : paths.adminUsers;
}

/** Daftar pengguna CMS (khusus Admin). Akun tidak dihapus, hanya dinonaktifkan. */
export default function UsersPage() {
  usePageMeta({ title: 'Pengguna', noindex: true });

  const { searchParams } = useLocation();
  const filters = readFilters(searchParams);
  const users = useUsers(filters);
  const [search, setSearch] = useState(filters.cari);

  const applyFilters = (changes: Partial<UserListFilters>) =>
    navigate(usersUrl({ ...filters, halaman: 1, ...changes }), { replace: true, scroll: false });

  const isFiltered = filters.status !== 'semua' || filters.cari.trim() !== '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-h5 font-semibold">Pengguna</h1>
          <p className="text-caption text-content-secondary">
            Kelola akun Admin dan Penulis. Akun tidak dihapus agar riwayat artikelnya tetap utuh;
            cabut akses dengan menonaktifkannya.
          </p>
        </div>
        <ButtonLink to={paths.adminUserNew} className="shrink-0">
          <IconPlus size={18} aria-hidden="true" />
          Tambah pengguna
        </ButtonLink>
      </div>

      <div className="space-y-4 rounded-xl border border-stroke-primary bg-background-primary p-4">
        <FilterChips
          label="Filter status akun"
          options={STATUS_OPTIONS}
          selected={filters.status}
          onSelect={(status) => applyFilters({ status })}
        />
        <TextField
          id="pengguna-cari"
          name="cari"
          label="Cari nama atau email"
          value={search}
          onChange={setSearch}
          debounce={350}
          onChangeDebounced={(value) => {
            if (value.trim() !== filters.cari.trim()) applyFilters({ cari: value });
          }}
          prefixIcon={<IconSearch size={16} aria-hidden="true" />}
          inputMode="search"
          autoComplete="off"
        />
      </div>

      <p role="status" className="text-caption text-content-secondary">
        {users.isPending ? 'Memuat pengguna…' : `${users.data?.meta.total ?? 0} pengguna`}
      </p>

      {users.isError ? (
        <LoadError
          title="Daftar pengguna gagal dimuat"
          message={users.error.message}
          onRetry={() => void users.refetch()}
        />
      ) : users.data && users.data.data.length === 0 ? (
        <EmptyState
          icon={<IconUsers size={32} aria-hidden="true" />}
          title="Tidak ada pengguna yang cocok"
          description={
            isFiltered
              ? 'Ubah atau hapus filter untuk melihat pengguna lain.'
              : 'Belum ada pengguna.'
          }
        />
      ) : (
        users.data && (
          <>
            <DataTable
              label="Tabel pengguna"
              head={
                <tr>
                  <HeaderCell>Nama</HeaderCell>
                  <HeaderCell>Peran</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell>Artikel</HeaderCell>
                  <HeaderCell>Terakhir masuk</HeaderCell>
                </tr>
              }
            >
              {users.data.data.map((user) => (
                <tr key={user.id} className="align-top hover:bg-background-secondary">
                  <td className="px-4 py-3">
                    <Link
                      to={paths.adminUser(user.id)}
                      className="font-semibold text-content-primary hover:text-primary-600 hover:underline"
                    >
                      {user.name}
                    </Link>
                    <p className="text-caption-sm text-content-secondary">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.role === 'admin' ? 'brand' : 'neutral'} size="sm">
                      {user.role_label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.is_active ? 'success' : 'error'} size="sm">
                      {user.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                    {user.must_change_password && (
                      <p className="mt-1 text-caption-sm text-content-secondary">
                        Belum mengganti kata sandi sementara
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-content-secondary">{user.articles_count}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-content-secondary">
                    {user.last_login_at ? formatDateTime(user.last_login_at) : 'Belum pernah'}
                  </td>
                </tr>
              ))}
            </DataTable>
            <PaginationNav
              currentPage={users.data.meta.current_page}
              totalPages={users.data.meta.last_page}
              hrefFor={(halaman) => usersUrl({ ...filters, halaman })}
            />
          </>
        )
      )}
    </div>
  );
}
