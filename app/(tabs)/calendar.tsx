import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, Pressable, Modal, TextInput, ImageBackground, ScrollView } from 'react-native';
import { Calendar as CalendarIcon, Clock, Droplets, X, Check, Plus, ChevronLeft, ChevronRight, Shirt } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useWardrobeStore } from '@/store/wardrobeStore';
import { Item, WearLogEntry, WashLogEntry } from '@/types/wardrobe';
import ItemCard from '@/components/ItemCard';
import ScheduleOutfitModal from '@/components/ScheduleOutfitModal';
import { usePlans } from '@/hooks/usePlans';

type CalendarView = 'month' | 'week' | 'list';
type LogType = 'wear' | 'wash';

const GOLD = '#C8A45D';
const BOX_BG = 'rgba(20,16,10,0.82)';
const BOX_BORDER = 'rgba(200,164,93,0.35)';

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [modalVisible, setModalVisible] = useState(false);
  const [logType, setLogType] = useState<LogType>('wear');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [logNote, setLogNote] = useState('');
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [editingOutfit, setEditingOutfit] = useState<any>(null);

  const items = useWardrobeStore((state) => state.items);
  const logItemWorn = useWardrobeStore((state) => state.logItemWorn);
  const logItemWashed = useWardrobeStore((state) => state.logItemWashed);
  const setNextWashDue = useWardrobeStore((state) => state.setNextWashDue);

  const { plansForDate, plansForRange } = usePlans({
    date: selectedDate,
    startDate: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
    endDate: new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
  });

  // ── Month calendar days ────────────────────────────────────────────────
  const calendarDays = useMemo(() => {
    const days = [];
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: '', day: '', isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i);
      const dateString = currentDate.toLocaleDateString('en-CA');
      days.push({ date: dateString, day: i.toString(), isCurrentMonth: true, isToday: dateString === new Date().toLocaleDateString('en-CA') });
    }
    return days;
  }, [selectedDate]);

  // ── Week days ──────────────────────────────────────────────────────────
  const weekDays = useMemo(() => {
    const days = [];
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateString = d.toLocaleDateString('en-CA');
      days.push({
        date: dateString,
        day: d.getDate().toString(),
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday: dateString === new Date().toLocaleDateString('en-CA'),
        isSelected: dateString === selectedDate.toLocaleDateString('en-CA'),
        hasOutfit: plansForRange.some(p => p.date_ymd === dateString),
        hasWear: items.some(item => item.wearHistory?.some(e => e.date === dateString)),
      });
    }
    return days;
  }, [selectedDate, plansForRange, items]);

  // Week label e.g. "Mar 30 – Apr 5"
  const weekLabel = useMemo(() => {
    if (!weekDays.length) return '';
    const first = new Date(weekDays[0].date);
    const last = new Date(weekDays[6].date);
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(first)} – ${fmt(last)}`;
  }, [weekDays]);

  // Past wear events for week view
  const weekWearHistory = useMemo(() => {
    const results: { date: string; item: Item; entry: WearLogEntry }[] = [];
    weekDays.forEach(day => {
      items.forEach(item => {
        item.wearHistory?.forEach(entry => {
          if (entry.date === day.date) results.push({ date: day.date, item, entry });
        });
      });
    });
    return results.sort((a, b) => b.date.localeCompare(a.date));
  }, [weekDays, items]);

  const eventsForSelectedDate = useMemo(() => {
    const selectedDateString = selectedDate.toLocaleDateString('en-CA');
    const wearEvents: { item: Item; entry: WearLogEntry }[] = [];
    const washEvents: { item: Item; entry: WashLogEntry }[] = [];
    items.forEach(item => {
      item.wearHistory?.forEach(entry => { if (entry.date === selectedDateString) wearEvents.push({ item, entry }); });
      item.washHistory?.forEach(entry => { if (entry.date === selectedDateString) washEvents.push({ item, entry }); });
    });
    return { wearEvents, washEvents, scheduledOutfits: plansForDate };
  }, [items, selectedDate, plansForDate]);

  const washDueItems = useMemo(() => {
    const s = selectedDate.toLocaleDateString('en-CA');
    return items.filter(item => item.nextWashDue === s);
  }, [items, selectedDate]);

  const allItems = useMemo(() => [...items].sort((a, b) => a.name.localeCompare(b.name)), [items]);

  const handleDateSelect = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    setSelectedDate(new Date(year, month - 1, day));
  };

  const handlePrevMonth = () => { const d = new Date(selectedDate); d.setMonth(d.getMonth() - 1); setSelectedDate(d); };
  const handleNextMonth = () => { const d = new Date(selectedDate); d.setMonth(d.getMonth() + 1); setSelectedDate(d); };
  const handlePrevWeek = () => { const d = new Date(selectedDate); d.setDate(d.getDate() - 7); setSelectedDate(d); };
  const handleNextWeek = () => { const d = new Date(selectedDate); d.setDate(d.getDate() + 7); setSelectedDate(d); };

  const openLogModal = (item: Item, type: LogType) => { setSelectedItem(item); setLogType(type); setLogNote(''); setModalVisible(true); };

  const handleLogSubmit = () => {
    if (!selectedItem) return;
    const s = selectedDate.toLocaleDateString('en-CA');
    if (logType === 'wear') {
      logItemWorn(selectedItem.id, { date: s, notes: logNote });
    } else {
      logItemWashed(selectedItem.id, { date: s, notes: logNote });
      const next = new Date(selectedDate);
      next.setDate(next.getDate() + 7);
      setNextWashDue(selectedItem.id, next.toLocaleDateString('en-CA'));
    }
    setModalVisible(false);
  };

  const openScheduleModal = (outfit?: any) => { setEditingOutfit(outfit || null); setScheduleModalVisible(true); };
  const closeScheduleModal = () => { setScheduleModalVisible(false); setEditingOutfit(null); };

  // ── Render helpers ────────────────────────────────────────────────────

  const renderCalendarHeader = () => (
    <View style={styles.calendarHeader}>
      <Pressable onPress={calendarView === 'week' ? handlePrevWeek : handlePrevMonth} style={styles.calendarNavButton}>
        <ChevronLeft size={20} color={GOLD} />
      </Pressable>
      <Text style={styles.calendarTitle}>
        {calendarView === 'week' ? weekLabel : `${selectedDate.toLocaleString('default', { month: 'long' })} ${selectedDate.getFullYear()}`}
      </Text>
      <Pressable onPress={calendarView === 'week' ? handleNextWeek : handleNextMonth} style={styles.calendarNavButton}>
        <ChevronRight size={20} color={GOLD} />
      </Pressable>
    </View>
  );

  const renderWeekView = () => (
    <>
      <View style={styles.calendarCard}>
        {renderCalendarHeader()}
        <View style={styles.weekStrip}>
          {weekDays.map((day, idx) => (
            <Pressable
              key={idx}
              style={[styles.weekDay, day.isSelected && styles.weekDaySelected, day.isToday && !day.isSelected && styles.weekDayToday]}
              onPress={() => handleDateSelect(day.date)}
            >
              <Text style={[styles.weekDayName, day.isSelected && styles.weekDayTextActive]}>{day.dayName}</Text>
              <Text style={[styles.weekDayNum, day.isSelected && styles.weekDayTextActive, day.isToday && styles.weekDayTodayNum]}>{day.day}</Text>
              <View style={styles.weekDayDots}>
                {day.hasOutfit && <View style={[styles.weekDot, { backgroundColor: GOLD }]} />}
                {day.hasWear && <View style={[styles.weekDot, { backgroundColor: colors.primary }]} />}
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Selected day events */}
      {renderSelectedDateEvents()}

      {/* Past outfits worn this week */}
      {weekWearHistory.length > 0 && (
        <View style={[styles.eventsContainer, { marginTop: 12 }]}>
          <View style={styles.eventSectionHeader}>
            <Shirt size={15} color={colors.primary} />
            <Text style={styles.eventSectionTitle}>Worn This Week</Text>
          </View>
          {weekWearHistory.map((e, i) => (
            <View key={i} style={styles.eventItem}>
              <Text style={styles.wornDate}>{new Date(e.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
              <ItemCard item={e.item} compact />
              {e.entry.notes && <Text style={styles.eventNote}>{e.entry.notes}</Text>}
            </View>
          ))}
        </View>
      )}
    </>
  );

  const renderSelectedDateEvents = () => {
    const { wearEvents, washEvents, scheduledOutfits } = eventsForSelectedDate;
    const formattedDate = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    return (
      <View style={styles.eventsContainer}>
        <View style={styles.eventsHeader}>
          <Text style={styles.eventsDate}>{formattedDate}</Text>
          <Pressable style={styles.addOutfitButton} onPress={() => openScheduleModal()}>
            <Plus size={16} color="white" />
            <Text style={styles.addOutfitButtonText}>Add Outfit</Text>
          </Pressable>
        </View>
        {scheduledOutfits.length > 0 && (
          <View style={styles.eventSection}>
            <View style={styles.eventSectionHeader}>
              <CalendarIcon size={16} color={GOLD} />
              <Text style={styles.eventSectionTitle}>Scheduled Outfits</Text>
            </View>
            {scheduledOutfits.map((plan: any) => (
              <View key={plan.id} style={styles.scheduledPlanCard}>
                <Text style={styles.scheduledPlanName}>{plan.name}</Text>
                <Text style={styles.scheduledPlanCategory}>{plan.category}</Text>
                {plan.notes && <Text style={styles.scheduledPlanNotes}>{plan.notes}</Text>}
                <Pressable style={styles.editPlanButton} onPress={() => openScheduleModal(plan)}>
                  <Text style={styles.editPlanButtonText}>Edit</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
        {wearEvents.length > 0 && (
          <View style={styles.eventSection}>
            <View style={styles.eventSectionHeader}>
              <Clock size={16} color={colors.primary} />
              <Text style={styles.eventSectionTitle}>Worn Items</Text>
            </View>
            {wearEvents.map((event, index) => (
              <View key={index} style={styles.eventItem}>
                <ItemCard item={event.item} compact />
                {event.entry.notes && <Text style={styles.eventNote}>{event.entry.notes}</Text>}
              </View>
            ))}
          </View>
        )}
        {washEvents.length > 0 && (
          <View style={styles.eventSection}>
            <View style={styles.eventSectionHeader}>
              <Droplets size={16} color={colors.info} />
              <Text style={styles.eventSectionTitle}>Washed Items</Text>
            </View>
            {washEvents.map((event, index) => (
              <View key={index} style={styles.eventItem}>
                <ItemCard item={event.item} compact />
                {event.entry.notes && <Text style={styles.eventNote}>{event.entry.notes}</Text>}
              </View>
            ))}
          </View>
        )}
        {washDueItems.length > 0 && (
          <View style={styles.eventSection}>
            <View style={styles.eventSectionHeader}>
              <Droplets size={16} color={colors.warning} />
              <Text style={styles.eventSectionTitle}>Wash Due</Text>
            </View>
            {washDueItems.map((item, index) => (
              <View key={index} style={styles.eventItem}>
                <ItemCard item={item} compact />
                <Pressable style={styles.washButton} onPress={() => openLogModal(item, 'wash')}>
                  <Text style={styles.washButtonText}>Log Wash</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
        {wearEvents.length === 0 && washEvents.length === 0 && washDueItems.length === 0 && scheduledOutfits.length === 0 && (
          <View style={styles.noEventsContainer}>
            <Text style={styles.noEventsText}>No events for this day</Text>
            <Pressable style={styles.addFirstOutfitButton} onPress={() => openScheduleModal()}>
              <Plus size={16} color={colors.primary} />
              <Text style={styles.addFirstOutfitButtonText}>Schedule your first outfit</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  const renderListView = () => (
    <View style={styles.listContainer}>
      {allItems.map((item) => (
        <View key={item.id} style={styles.listItem}>
          <ItemCard item={item} />
          <View style={styles.listItemActions}>
            <Pressable style={[styles.listItemAction, { backgroundColor: colors.primary }]} onPress={() => openLogModal(item, 'wear')}>
              <Clock size={16} color="white" />
              <Text style={styles.listItemActionText}>Wore Today</Text>
            </Pressable>
            <Pressable style={[styles.listItemAction, { backgroundColor: colors.info }]} onPress={() => openLogModal(item, 'wash')}>
              <Droplets size={16} color="white" />
              <Text style={styles.listItemActionText}>Washed Today</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <ImageBackground source={require('../../assets/images/closet-backdrop.png')} style={{ flex: 1 }} imageStyle={{ width: '100%', height: '100%' }} resizeMode="cover">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Calendar</Text>
          <View style={styles.viewToggle}>
            <Pressable style={[styles.toggleButton, calendarView === 'month' && styles.activeToggleButton]} onPress={() => setCalendarView('month')}>
              <CalendarIcon size={16} color={calendarView === 'month' ? colors.primary : colors.subtext} />
              <Text style={[styles.toggleButtonText, calendarView === 'month' && styles.activeToggleButtonText]}>Month</Text>
            </Pressable>
            <Pressable style={[styles.toggleButton, calendarView === 'week' && styles.activeToggleButton]} onPress={() => setCalendarView('week')}>
              <CalendarIcon size={16} color={calendarView === 'week' ? colors.primary : colors.subtext} />
              <Text style={[styles.toggleButtonText, calendarView === 'week' && styles.activeToggleButtonText]}>Week</Text>
            </Pressable>
            <Pressable style={[styles.toggleButton, calendarView === 'list' && styles.activeToggleButton]} onPress={() => setCalendarView('list')}>
              <Clock size={16} color={calendarView === 'list' ? colors.primary : colors.subtext} />
              <Text style={[styles.toggleButtonText, calendarView === 'list' && styles.activeToggleButtonText]}>Log</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {calendarView === 'month' ? (
            <>
              <View style={styles.calendarCard}>
                {renderCalendarHeader()}
                <View style={styles.calendarDaysHeader}>
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, i) => (
                    <Text key={i} style={styles.calendarDayName}>{d}</Text>
                  ))}
                </View>
                <View style={styles.calendarGrid}>
                  {calendarDays.map((day, index) => {
                    if (!day.isCurrentMonth) return <View key={index} style={styles.calendarEmptyDay} />;
                    const hasWear = items.some(item => item.wearHistory?.some(e => e.date === day.date));
                    const hasWash = items.some(item => item.washHistory?.some(e => e.date === day.date));
                    const hasWashDue = items.some(item => item.nextWashDue === day.date);
                    const hasOutfit = plansForRange.some(p => p.date_ymd === day.date);
                    return (
                      <Pressable key={index} style={[styles.calendarDay, selectedDate.toLocaleDateString('en-CA') === day.date && styles.calendarSelectedDay, day.isToday && styles.calendarToday]} onPress={() => handleDateSelect(day.date)}>
                        <Text style={[styles.calendarDayText, selectedDate.toLocaleDateString('en-CA') === day.date && styles.calendarSelectedDayText, day.isToday && styles.calendarTodayText]}>{day.day}</Text>
                        <View style={styles.calendarDayIndicators}>
                          {hasOutfit && <View style={[styles.calendarDayIndicator, { backgroundColor: GOLD }]} />}
                          {hasWear && <View style={[styles.calendarDayIndicator, { backgroundColor: colors.primary }]} />}
                          {hasWash && <View style={[styles.calendarDayIndicator, { backgroundColor: colors.info }]} />}
                          {hasWashDue && <View style={[styles.calendarDayIndicator, { backgroundColor: colors.warning }]} />}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              {renderSelectedDateEvents()}
            </>
          ) : calendarView === 'week' ? (
            renderWeekView()
          ) : (
            renderListView()
          )}
        </ScrollView>

        <Modal visible={modalVisible} transparent={true} animationType="slide" onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{logType === 'wear' ? 'Log Item Worn' : 'Log Item Washed'}</Text>
                <Pressable onPress={() => setModalVisible(false)}><X size={24} color={colors.text} /></Pressable>
              </View>
              {selectedItem && <View style={styles.modalItem}><ItemCard item={selectedItem} /></View>}
              <View style={styles.modalForm}>
                <Text style={styles.modalLabel}>Date</Text>
                <Text style={styles.modalDate}>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
                <Text style={styles.modalLabel}>Notes (Optional)</Text>
                <TextInput style={styles.modalInput} value={logNote} onChangeText={setLogNote} placeholder="Add notes..." placeholderTextColor={colors.mediumGray} multiline numberOfLines={3} textAlignVertical="top" />
              </View>
              <Pressable style={styles.modalSubmitButton} onPress={handleLogSubmit}>
                <Check size={18} color="white" />
                <Text style={styles.modalSubmitButtonText}>{logType === 'wear' ? 'Log Wear' : 'Log Wash'}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <ScheduleOutfitModal visible={scheduleModalVisible} onClose={closeScheduleModal} selectedDate={selectedDate} editingOutfit={editingOutfit || undefined} />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  viewToggle: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 8, padding: 4 },
  toggleButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6 },
  activeToggleButton: { backgroundColor: colors.background },
  toggleButtonText: { fontSize: 12, color: colors.subtext, marginLeft: 4 },
  activeToggleButtonText: { color: colors.primary, fontWeight: '500' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 8, paddingBottom: 90 },
  calendarCard: { backgroundColor: BOX_BG, borderRadius: 16, borderWidth: 1, borderColor: BOX_BORDER, padding: 12, marginBottom: 12 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  calendarTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  calendarNavButton: { padding: 8 },
  calendarDaysHeader: { flexDirection: 'row', marginBottom: 6 },
  calendarDayName: { flex: 1, textAlign: 'center', fontSize: 11, color: colors.subtext, fontWeight: '600' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDay: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  calendarEmptyDay: { width: '14.28%', aspectRatio: 1 },
  calendarSelectedDay: { backgroundColor: GOLD + '20', borderRadius: 8 },
  calendarToday: { borderWidth: 2, borderColor: GOLD, borderRadius: 8 },
  calendarDayText: { fontSize: 13, color: colors.text },
  calendarSelectedDayText: { color: GOLD, fontWeight: '700' },
  calendarTodayText: { color: GOLD, fontWeight: '700' },
  calendarDayIndicators: { flexDirection: 'row', marginTop: 2 },
  calendarDayIndicator: { width: 5, height: 5, borderRadius: 3, marginHorizontal: 1 },

  // Week view
  weekStrip: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDay: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, marginHorizontal: 2 },
  weekDaySelected: { backgroundColor: GOLD + '20', borderWidth: 1.5, borderColor: GOLD },
  weekDayToday: { borderWidth: 1.5, borderColor: GOLD },
  weekDayName: { fontSize: 10, fontWeight: '600', color: colors.subtext, marginBottom: 4 },
  weekDayNum: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 4 },
  weekDayTextActive: { color: GOLD },
  weekDayTodayNum: { color: GOLD },
  weekDayDots: { flexDirection: 'row', gap: 2 },
  weekDot: { width: 5, height: 5, borderRadius: 3 },
  wornDate: { fontSize: 11, color: colors.subtext, fontWeight: '600', marginBottom: 4 },

  // Events
  eventsContainer: { backgroundColor: colors.card, borderRadius: 12, padding: 16 },
  eventsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  eventsDate: { fontSize: 15, fontWeight: '700', color: colors.text },
  addOutfitButton: { backgroundColor: GOLD, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center' },
  addOutfitButtonText: { color: 'white', fontSize: 12, fontWeight: '600', marginLeft: 4 },
  eventSection: { marginBottom: 16 },
  eventSectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  eventSectionTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginLeft: 8 },
  eventItem: { marginBottom: 8 },
  eventNote: { fontSize: 12, color: colors.subtext, marginTop: 4, marginLeft: 8, fontStyle: 'italic' },
  noEventsContainer: { alignItems: 'center', padding: 24 },
  noEventsText: { fontSize: 14, color: colors.subtext, fontStyle: 'italic', marginBottom: 12 },
  addFirstOutfitButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: colors.primary },
  addFirstOutfitButtonText: { color: colors.primary, fontSize: 14, fontWeight: '500', marginLeft: 8 },
  washButton: { backgroundColor: colors.info, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-end', marginTop: -30, marginRight: 8 },
  washButtonText: { fontSize: 12, color: 'white', fontWeight: '500' },

  // List view
  listContainer: { marginBottom: 16 },
  listItem: { marginBottom: 16 },
  listItemActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  listItemAction: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginLeft: 8 },
  listItemActionText: { fontSize: 12, color: 'white', fontWeight: '500', marginLeft: 4 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.background, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  modalItem: { marginBottom: 16 },
  modalForm: { marginBottom: 16 },
  modalLabel: { fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 8 },
  modalDate: { fontSize: 16, color: colors.text, marginBottom: 16 },
  modalInput: { backgroundColor: colors.card, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: colors.text, minHeight: 80 },
  modalSubmitButton: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  modalSubmitButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },

  // Scheduled plan
  scheduledPlanCard: { backgroundColor: colors.background, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  scheduledPlanName: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 4 },
  scheduledPlanCategory: { fontSize: 12, color: colors.subtext, textTransform: 'capitalize', marginBottom: 4 },
  scheduledPlanNotes: { fontSize: 12, color: colors.subtext, fontStyle: 'italic', marginBottom: 8 },
  editPlanButton: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  editPlanButtonText: { color: 'white', fontSize: 12, fontWeight: '500' },
});
