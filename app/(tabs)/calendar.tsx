import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, Pressable, Modal, TextInput, ImageBackground } from 'react-native';
import { Calendar as CalendarIcon, Clock, Droplets, X, Check, Plus, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useWardrobeStore } from '@/store/wardrobeStore';
import { Item, WearLogEntry, WashLogEntry } from '@/types/wardrobe';
import ItemCard from '@/components/ItemCard';
import ScheduleOutfitModal from '@/components/ScheduleOutfitModal';
import { usePlans } from '@/hooks/usePlans';

type CalendarView = 'month' | 'week' | 'list';
type LogType = 'wear' | 'wash';

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
      days.push({
        date: dateString,
        day: i.toString(),
        isCurrentMonth: true,
        isToday: dateString === new Date().toLocaleDateString('en-CA'),
      });
    }
    return days;
  }, [selectedDate]);

  const eventsForSelectedDate = useMemo(() => {
    const selectedDateString = selectedDate.toLocaleDateString('en-CA');
    const wearEvents: { item: Item; entry: WearLogEntry }[] = [];
    const washEvents: { item: Item; entry: WashLogEntry }[] = [];
    items.forEach(item => {
      if (item.wearHistory) {
        item.wearHistory.forEach(entry => {
          if (entry.date === selectedDateString) wearEvents.push({ item, entry });
        });
      }
      if (item.washHistory) {
        item.washHistory.forEach(entry => {
          if (entry.date === selectedDateString) washEvents.push({ item, entry });
        });
      }
    });
    return { wearEvents, washEvents, scheduledOutfits: plansForDate };
  }, [items, selectedDate, plansForDate]);

  const washDueItems = useMemo(() => {
    const selectedDateString = selectedDate.toLocaleDateString('en-CA');
    return items.filter(item => item.nextWashDue === selectedDateString);
  }, [items, selectedDate]);

  const allItems = useMemo(() => [...items].sort((a, b) => a.name.localeCompare(b.name)), [items]);

  const handleDateSelect = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    setSelectedDate(new Date(year, month - 1, day));
  };

  const handlePrevMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
  };

  const openLogModal = (item: Item, type: LogType) => {
    setSelectedItem(item);
    setLogType(type);
    setLogNote('');
    setModalVisible(true);
  };

  const handleLogSubmit = () => {
    if (!selectedItem) return;
    const selectedDateString = selectedDate.toLocaleDateString('en-CA');
    if (logType === 'wear') {
      logItemWorn(selectedItem.id, { date: selectedDateString, notes: logNote });
    } else {
      logItemWashed(selectedItem.id, { date: selectedDateString, notes: logNote });
      const nextWashDate = new Date(selectedDate);
      nextWashDate.setDate(nextWashDate.getDate() + 7);
      setNextWashDue(selectedItem.id, nextWashDate.toLocaleDateString('en-CA'));
    }
    setModalVisible(false);
  };

  const openScheduleModal = (outfit?: any) => {
    setEditingOutfit(outfit || null);
    setScheduleModalVisible(true);
  };

  const closeScheduleModal = () => {
    setScheduleModalVisible(false);
    setEditingOutfit(null);
  };

  const renderCalendarHeader = () => {
    const monthName = selectedDate.toLocaleString('default', { month: 'long' });
    const year = selectedDate.getFullYear();
    return (
      <View style={styles.calendarHeader}>
        <Pressable onPress={handlePrevMonth} style={styles.calendarNavButton}>
          <ChevronLeft size={20} color={colors.primary} />
        </Pressable>
        <Text style={styles.calendarTitle}>{monthName} {year}</Text>
        <Pressable onPress={handleNextMonth} style={styles.calendarNavButton}>
          <ChevronRight size={20} color={colors.primary} />
        </Pressable>
      </View>
    );
  };

  const renderCalendarDays = () => {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <View style={styles.calendarDaysHeader}>
        {weekdays.map((day, index) => (
          <Text key={index} style={styles.calendarDayName}>{day}</Text>
        ))}
      </View>
    );
  };

  const renderCalendarGrid = () => {
    return (
      <View style={styles.calendarGrid}>
        {calendarDays.map((day, index) => {
          if (!day.isCurrentMonth) {
            return <View key={index} style={styles.calendarEmptyDay} />;
          }
          const hasWearEvents = items.some(item => item.wearHistory && item.wearHistory.some(e => e.date === day.date));
          const hasWashEvents = items.some(item => item.washHistory && item.washHistory.some(e => e.date === day.date));
          const hasWashDue = items.some(item => item.nextWashDue === day.date);
          const hasScheduledOutfits = plansForRange.some(plan => plan.date_ymd === day.date);
          return (
            <Pressable
              key={index}
              style={[
                styles.calendarDay,
                selectedDate.toLocaleDateString('en-CA') === day.date && styles.calendarSelectedDay,
                day.isToday && styles.calendarToday
              ]}
              onPress={() => handleDateSelect(day.date)}
            >
              <Text style={[
                styles.calendarDayText,
                selectedDate.toLocaleDateString('en-CA') === day.date && styles.calendarSelectedDayText,
                day.isToday && styles.calendarTodayText
              ]}>
                {day.day}
              </Text>
              <View style={styles.calendarDayIndicators}>
                {hasScheduledOutfits && <View style={[styles.calendarDayIndicator, { backgroundColor: '#C8A45D' }]} />}
                {hasWearEvents && <View style={[styles.calendarDayIndicator, { backgroundColor: colors.primary }]} />}
                {hasWashEvents && <View style={[styles.calendarDayIndicator, { backgroundColor: colors.info }]} />}
                {hasWashDue && <View style={[styles.calendarDayIndicator, { backgroundColor: colors.warning }]} />}
              </View>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const renderSelectedDateEvents = () => {
    const { wearEvents, washEvents, scheduledOutfits } = eventsForSelectedDate;
    const formattedDate = selectedDate.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric'
    });
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
              <CalendarIcon size={16} color="#C8A45D" />
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

  const renderListView = () => {
    return (
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
  };

  return (
    <ImageBackground
      source={require('../../assets/images/closet-backdrop.png')}
      style={{ flex: 1 }}
      imageStyle={{ width: '100%', height: '100%' }}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Calendar</Text>
        </View>
        <View style={styles.tabRow}>
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

        <View style={styles.body}>
          {calendarView === 'month' || calendarView === 'week' ? (
            <>
              <View style={styles.calendarCard}>
                {renderCalendarHeader()}
                {renderCalendarDays()}
                {renderCalendarGrid()}
              </View>
              {renderSelectedDateEvents()}
            </>
          ) : (
            renderListView()
          )}
        </View>
      </View>

      <Modal visible={modalVisible} transparent={true} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{logType === 'wear' ? 'Log Item Worn' : 'Log Item Washed'}</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <X size={24} color={colors.text} />
              </Pressable>
            </View>
            {selectedItem && (
              <View style={styles.modalItem}>
                <ItemCard item={selectedItem} />
              </View>
            )}
            <View style={styles.modalForm}>
              <Text style={styles.modalLabel}>Date</Text>
              <Text style={styles.modalDate}>
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
              <Text style={styles.modalLabel}>Notes (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                value={logNote}
                onChangeText={setLogNote}
                placeholder="Add notes about this event..."
                placeholderTextColor={colors.mediumGray}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
            <Pressable style={styles.modalSubmitButton} onPress={handleLogSubmit}>
              <Check size={18} color="white" />
              <Text style={styles.modalSubmitButtonText}>{logType === 'wear' ? 'Log Wear' : 'Log Wash'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ScheduleOutfitModal
        visible={scheduleModalVisible}
        onClose={closeScheduleModal}
        selectedDate={selectedDate}
        editingOutfit={editingOutfit || undefined}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeToggleButton: {
    backgroundColor: colors.background,
  },
  toggleButtonText: {
    fontSize: 12,
    color: colors.subtext,
    marginLeft: 4,
  },
  activeToggleButtonText: {
    color: colors.primary,
    fontWeight: '500',
  },
  tabRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  calendarCard: {
    backgroundColor: 'rgba(20, 16, 10, 0.75)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(200, 164, 93, 0.35)',
    padding: 12,
    marginBottom: 12,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  calendarNavButton: {
    padding: 8,
  },
  calendarDaysHeader: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  calendarDayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: colors.subtext,
    fontWeight: '500',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  calendarEmptyDay: {
    width: '14.28%',
    aspectRatio: 1,
  },
  calendarSelectedDay: {
    backgroundColor: '#C8A45D20',
    borderRadius: 8,
  },
  calendarToday: {
    borderWidth: 2,
    borderColor: '#C8A45D',
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 14,
    color: colors.text,
  },
  calendarSelectedDayText: {
    color: '#C8A45D',
    fontWeight: '600',
  },
  calendarTodayText: {
    color: '#C8A45D',
    fontWeight: '600',
  },
  calendarDayIndicators: {
    flexDirection: 'row',
    marginTop: 2,
  },
  calendarDayIndicator: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginHorizontal: 1,
  },
  eventsContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    flex: 1,
  },
  eventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  eventsDate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  addOutfitButton: {
    backgroundColor: '#C8A45D',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addOutfitButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  eventSection: {
    marginBottom: 16,
  },
  eventSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  eventItem: {
    marginBottom: 8,
  },
  eventNote: {
    fontSize: 12,
    color: colors.subtext,
    marginTop: 4,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  noEventsContainer: {
    alignItems: 'center',
    padding: 24,
  },
  noEventsText: {
    fontSize: 14,
    color: colors.subtext,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  addFirstOutfitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  addFirstOutfitButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  washButton: {
    backgroundColor: colors.info,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-end',
    marginTop: -30,
    marginRight: 8,
  },
  washButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  listContainer: {
    marginBottom: 16,
  },
  listItem: {
    marginBottom: 16,
  },
  listItemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  listItemAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  listItemActionText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalItem: {
    marginBottom: 16,
  },
  modalForm: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  modalDate: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
    minHeight: 80,
  },
  modalSubmitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  modalSubmitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  scheduledPlanCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scheduledPlanName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  scheduledPlanCategory: {
    fontSize: 12,
    color: colors.subtext,
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  scheduledPlanNotes: {
    fontSize: 12,
    color: colors.subtext,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  editPlanButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  editPlanButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});
