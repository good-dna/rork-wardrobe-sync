import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as XLSX from 'xlsx';
import { Stack, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useWardrobeStore } from '@/store/wardrobeStore';
import { colors, tokens } from '@/constants/colors';
import { Upload, FileText, Check, ChevronRight } from 'lucide-react-native';
import { Item, Category, Season, CleaningStatus } from '@/types/wardrobe';

type WardrobeImportRow = {
  name?: string;
  category?: string;
  brand?: string;
  color?: string;
  size?: string | number;
  condition?: string;
  season?: string;
  price?: string | number;
  image_url?: string;
  notes?: string;
};

type NormalizedWardrobeItem = {
  user_id: string;
  name: string;
  category: string;
  brand: string | null;
  color: string | null;
  size: string | null;
  season: string | null;
  price: number | null;
  image_url: string | null;
  notes: string | null;
};

const REQUIRED_COLUMNS = ['name'];
const SUGGESTED_COLUMNS = ['name', 'category', 'brand', 'color', 'size', 'season', 'price', 'image_url', 'notes'];

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim()); current = '';
    } else { current += char; }
  }
  result.push(current.trim());
  return result;
}

function parseCsv(text: string): WardrobeImportRow[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().trim());
  return lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, i) => { row[header] = values[i] ?? ''; });
    return row;
  });
}

function normalizeRow(row: WardrobeImportRow, userId: string): NormalizedWardrobeItem | null {
  const name = row.name?.toString().trim() || '';
  if (!name) return null;
  const rawPrice = row.price?.toString().trim();
  const price = rawPrice && !isNaN(Number(rawPrice)) ? Number(rawPrice) : null;
  return {
    user_id: userId,
    name,
    category: row.category?.toString().trim() || 'shirts',
    brand: row.brand?.toString().trim() || null,
    color: row.color?.toString().trim() || null,
    size: row.size?.toString().trim() || null,
    season: row.season?.toString().trim() || null,
    price,
    image_url: row.image_url?.toString().trim() || null,
    notes: row.notes?.toString().trim() || null,
  };
}

export default function ImportWardrobeScreen() {
  const router = useRouter();
  const addItem = useWardrobeStore(state => state.addItem);
  const [loading, setLoading] = useState(false);
  const [normalizedRows, setNormalizedRows] = useState<NormalizedWardrobeItem[]>([]);
  const [fileName, setFileName] = useState('');
  const [imported, setImported] = useState(false);

  const previewRows = useMemo(() => normalizedRows.slice(0, 5), [normalizedRows]);

  const handleChooseFile = async () => {
    try {
      setLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri || !asset?.name) throw new Error('No file selected.');
      setFileName(asset.name);
      const ext = asset.name.split('.').pop()?.toLowerCase();
      let rows: WardrobeImportRow[] = [];

      if (ext === 'csv') {
        const text = await FileSystem.readAsStringAsync(asset.uri, { encoding: 'utf8' as any });
        rows = parseCsv(text);
      } else if (ext === 'xlsx' || ext === 'xls') {
        const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: 'base64' as any });
        const workbook = XLSX.read(base64, { type: 'base64' });
        const firstSheet = workbook.SheetNames[0];
        rows = XLSX.utils.sheet_to_json<WardrobeImportRow>(workbook.Sheets[firstSheet], { defval: '' });
      } else {
        throw new Error('Unsupported file type. Please upload a CSV or Excel file.');
      }

      if (!rows.length) throw new Error('The file is empty.');

      const firstRowKeys = Object.keys(rows[0]).map(k => k.toLowerCase().trim());
      const missing = REQUIRED_COLUMNS.filter(c => !firstRowKeys.includes(c));
      if (missing.length) throw new Error(`Missing required column(s): ${missing.join(', ')}`);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('You must be signed in to import items.');

      const cleaned = rows.map(row => normalizeRow(row, user.id)).filter((item): item is NormalizedWardrobeItem => item !== null);
      if (!cleaned.length) throw new Error('No valid rows found. Each row needs at least a name.');
      setNormalizedRows(cleaned);
    } catch (error: any) {
      Alert.alert('Import Error', error?.message || 'Could not read the file.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!normalizedRows.length) { Alert.alert('Nothing to import', 'Please choose a file first.'); return; }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Save to Supabase
      const { error } = await supabase.from('wardrobe_items').insert(normalizedRows);
      if (error) throw error;

      // Also add to local store
      normalizedRows.forEach(row => {
        const item: Item = {
          id: `import_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          name: row.name,
          brand: row.brand || '',
          category: (row.category as Category) || 'shirts',
          color: row.color || '',
          material: '',
          season: row.season ? [row.season as Season] : ['all'],
          purchaseDate: new Date().toISOString().split('T')[0],
          purchasePrice: row.price || 0,
          wearCount: 0,
          lastWorn: new Date().toISOString().split('T')[0],
          imageUrl: row.image_url || '',
          notes: row.notes || '',
          tags: [],
          cleaningStatus: 'clean' as CleaningStatus,
          wearHistory: [],
          washHistory: [],
        };
        addItem(item);
      });

      setImported(true);
      Alert.alert('Import Complete!', `${normalizedRows.length} items added to your wardrobe.`, [
        { text: 'View Wardrobe', onPress: () => router.push('/(tabs)/wardrobe' as any) },
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Save Error', error?.message || 'Could not import items.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Import Wardrobe',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={s.container} contentContainerStyle={s.content}>

        {/* Header card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Bulk Wardrobe Import</Text>
          <Text style={s.cardSub}>Upload a CSV or Excel file to import all your clothing items at once.</Text>
        </View>

        {/* Template info */}
        <View style={s.templateCard}>
          <Text style={s.templateTitle}>Recommended columns</Text>
          <Text style={s.templateCols}>{SUGGESTED_COLUMNS.join(', ')}</Text>
          <Text style={s.templateNote}>Required: name only. Category defaults to "shirts" when missing.</Text>
        </View>

        {/* Choose file button */}
        <Pressable style={s.uploadBtn} onPress={handleChooseFile} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <>
              <Upload size={20} color={colors.background} />
              <Text style={s.uploadBtnText}>Choose CSV or Excel File</Text>
            </>
          )}
        </Pressable>

        {/* File selected */}
        {!!fileName && (
          <View style={s.fileCard}>
            <FileText size={20} color={colors.primary} />
            <View style={s.fileInfo}>
              <Text style={s.fileName}>{fileName}</Text>
              <Text style={s.fileRows}>{normalizedRows.length} rows ready to import</Text>
            </View>
            {normalizedRows.length > 0 && <Check size={20} color={colors.primary} />}
          </View>
        )}

        {/* Preview */}
        {previewRows.length > 0 && (
          <View style={s.card}>
            <Text style={s.previewTitle}>Preview (first 5 rows)</Text>
            {previewRows.map((item, i) => (
              <View key={i} style={s.previewRow}>
                <Text style={s.previewName}>{item.name}</Text>
                <Text style={s.previewMeta}>
                  {[item.category, item.brand, item.color].filter(Boolean).join(' · ')}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Import button */}
        <Pressable
          style={[s.importBtn, (!normalizedRows.length || loading) && s.importBtnDisabled]}
          onPress={handleImport}
          disabled={loading || !normalizedRows.length}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <>
              <Check size={20} color={colors.background} />
              <Text style={s.importBtnText}>Import to Wardrobe</Text>
            </>
          )}
        </Pressable>

      </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: tokens.spacing.lg, gap: 12, paddingBottom: 60 },
  card: { backgroundColor: colors.card, borderRadius: tokens.radius.xl, padding: tokens.spacing.lg, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 6 },
  cardSub: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  templateCard: { backgroundColor: colors.backgroundSecondary || colors.card, borderRadius: tokens.radius.xl, padding: tokens.spacing.lg, borderWidth: 1, borderColor: colors.border },
  templateTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 6 },
  templateCols: { fontSize: 13, color: colors.text, lineHeight: 20, marginBottom: 8 },
  templateNote: { fontSize: 12, color: colors.textSecondary },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.text, borderRadius: tokens.radius.lg, paddingVertical: 14, gap: 8 },
  uploadBtnText: { fontSize: 15, fontWeight: '600', color: colors.background },
  fileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: tokens.radius.lg, padding: tokens.spacing.md, borderWidth: 1, borderColor: colors.primary, gap: 12 },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 14, fontWeight: '600', color: colors.text },
  fileRows: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  previewTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
  previewRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  previewName: { fontSize: 14, fontWeight: '600', color: colors.text },
  previewMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  importBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: tokens.radius.lg, paddingVertical: 14, gap: 8 },
  importBtnDisabled: { opacity: 0.4 },
  importBtnText: { fontSize: 15, fontWeight: '700', color: colors.background },
});
