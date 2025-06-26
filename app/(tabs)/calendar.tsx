import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Modal, TextInput } from 'react-native';
import { Calendar as CalendarIcon, Clock, Droplets, X, Check } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { useWardrobeStore } from '@/store/wardrobeStore';
import { Item, WearLogEntry, WashLogEntry } from '@/types/wardrobe';
import ItemCard from '@/components/ItemCard';

type CalendarView = 'month' | 'list';
type LogType = 'wear' | 'wash';

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [modalVisible, setModalVisible] = useState(false);
  const [logType, setLogType] = useState<LogType>('wear');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [logNote, setLogNote] = useState('');
  
  const items = useWardrobeStore((state) => state.items);
  const logItemWorn = useWardrobeStore((state) => state.logItemWorn);
  const logItemWashed = useWardrobeStore((state) => state.logItemWashed);
  const setNextWashDue = useWardrobeStore((state) => state.setNextWashDue);
  
  // Generate calendar days for the current month
  const calendarDays = useMemo(() => {
    const days = [];
    const date = new Date(selectedDate);
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Get first day of month
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();
    
    // Get days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Add empty days for start of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: '', day: '', isCurrentMonth: false });
    }
    
    // Add days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i);
      const dateString = currentDate.toISOString().split('T')[0];
      days.push({
        date: dateString,
        day: i.toString(),
        isCurrentMonth: true,
        isToday: dateString === new Date().toISOString().split('T')[0],
      });
    }
    
    return days;
  }, [selectedDate]);
  
  // Get events for the selected date
  const eventsForSelectedDate = useMemo(() => {
    const wearEvents: { item: Item; entry: WearLogEntry }[] = [];
    const washEvents: { item: Item; entry: WashLogEntry }[] = [];
    
    items.forEach(item => {
      // Check wear history
      if (item.wearHistory) {
        item.wearHistory.forEach(entry => {
          if (entry.date === selectedDate) {
            wearEvents.push({ item, entry });
          }
        });
      }
      
      // Check wash history
      if (item.washHistory) {
        item.washHistory.forEach(entry => {
          if (entry.date === selectedDate) {
            washEvents.push({ item, entry });
          }
        });
      }
    });
    
    return { wearEvents, washEvents };
  }, [items, selectedDate]);
  
  // Get items with wash due on selected date
  const washDueItems = useMemo(() => {
    return items.filter(item => item.nextWashDue === selectedDate);
  }, [items, selectedDate]);
  
  // Get all items for list view
  const allItems = useMemo(() => {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);
  
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };
  
  const handlePrevMonth = () => {
    const date = new Date(selectedDate);
    date.setMonth(date.getMonth() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };
  
  const handleNextMonth = () => {
    const date = new Date(selectedDate);
    date.setMonth(date.getMonth() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };
  
  const openLogModal = (item: Item, type: LogType) => {
    setSelectedItem(item);
    setLogType(type);
    setLogNote('');
    setModalVisible(true);
  };
  
  const handleLogSubmit = () => {
    if (!selectedItem) return;
    
    if (logType === 'wear') {
      logItemWorn(selectedItem.id, {
        date: selectedDate,
        notes: logNote
      });
    } else {
      logItemWashed(selectedItem.id, {
        date: selectedDate,
        notes: logNote
      });
      
      // Set next wash due date (e.g., 7 days after washing)
      const nextWashDate = new Date(selectedDate);
      nextWashDate.setDate(nextWashDate.getDate() + 7);
      setNextWashDue(selectedItem.id, nextWashDate.toISOString().split('T')[0]);
    }
    
    setModalVisible(false);
  };
  
  const renderCalendarHeader = () => {
    const date = new Date(selectedDate);
    const monthName = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    
    return (
      <View style={styles.calendarHeader}>
        <Pressable onPress={handlePrevMonth} style={styles.calendarNavButton}>
          <Text style={styles.calendarNavButtonText}>←</Text>
        </Pressable>
        <Text style={styles.calendarTitle}>{monthName} {year}</Text>
        <Pressable onPress={handleNextMonth} style={styles.calendarNavButton}>
          <Text style={styles.calendarNavButtonText}>→</Text>
        </Pressable>
      </View>
    );
  };
  
  const renderCalendarDays = () => {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <View style={styles.calendarDaysHeader}>
        {weekdays.map((day, index) => (
          <Text key={index} style={styles.calendarDayName}>
            {day}
          </Text>
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
          
          // Check if there are events on this day
          const hasWearEvents = items.some(item => 
            item.wearHistory && item.wearHistory.some(entry => entry.date === day.date)
          );
          
          const hasWashEvents = items.some(item => 
            item.washHistory && item.washHistory.some(entry => entry.date === day.date)
          );
          
          const hasWashDue = items.some(item => item.nextWashDue === day.date);
          
          return (
            <Pressable
              key={index}
              style={[
                styles.calendarDay,
                selectedDate === day.date && styles.calendarSelectedDay,
                day.isToday && styles.calendarToday
              ]}
              onPress={() => handleDateSelect(day.date)}
            >
              <Text 
                style={[
                  styles.calendarDayText,
                  selectedDate === day.date && styles.calendarSelectedDayText,
                  day.isToday && styles.calendarTodayText
                ]}
              >
                {day.day}
              </Text>
              <View style={styles.calendarDayIndicators}>
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
    const { wearEvents, washEvents } = eventsForSelectedDate;
    const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
    
    return (
      <View style={styles.eventsContainer}>
        <Text style={styles.eventsDate}>{formattedDate}</Text>
        
        {wearEvents.length > 0 && (
          <View style={styles.eventSection}>
            <View style={styles.eventSectionHeader}>
              <Clock size={16} color={colors.primary} />
              <Text style={styles.eventSectionTitle}>Worn Items</Text>
            </View>
            {wearEvents.map((event, index) => (
              <View key={index} style={styles.eventItem}>
                <ItemCard item={event.item} compact />
                {event.entry.notes && (
                  <Text style={styles.eventNote}>{event.entry.notes}</Text>
                )}
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
                {event.entry.notes && (
                  <Text style={styles.eventNote}>{event.entry.notes}</Text>
                )}
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
                <Pressable 
                  style={styles.washButton}
                  onPress={() => openLogModal(item, 'wash')}
                >
                  <Text style={styles.washButtonText}>Log Wash</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
        
        {wearEvents.length === 0 && washEvents.length === 0 && washDueItems.length === 0 && (
          <View style={styles.noEventsContainer}>
            <Text style={styles.noEventsText}>No events for this day</Text>
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
              <Pressable 
                style={[styles.listItemAction, { backgroundColor: colors.primary }]}
                onPress={() => openLogModal(item, 'wear')}
              >
                <Clock size={16} color="white" />
                <Text style={styles.listItemActionText}>Wore Today</Text>
              </Pressable>
              <Pressable 
                style={[styles.listItemAction, { backgroundColor: colors.info }]}
                onPress={() => openLogModal(item, 'wash')}
              >
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
        <View style={styles.viewToggle}>
          <Pressable
            style={[
              styles.toggleButton,
              calendarView === 'month' && styles.activeToggleButton
            ]}
            onPress={() => setCalendarView('month')}
          >
            <CalendarIcon size={16} color={calendarView === 'month' ? colors.primary : colors.subtext} />
            <Text 
              style={[
                styles.toggleButtonText,
                calendarView === 'month' && styles.activeToggleButtonText
              ]}
            >
              Calendar
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.toggleButton,
              calendarView === 'list' && styles.activeToggleButton
            ]}
            onPress={() => setCalendarView('list')}
          >
            <Clock size={16} color={calendarView === 'list' ? colors.primary : colors.subtext} />
            <Text 
              style={[
                styles.toggleButtonText,
                calendarView === 'list' && styles.activeToggleButtonText
              ]}
            >
              Log
            </Text>
          </Pressable>
        </View>
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {calendarView === 'month' ? (
          <>
            {renderCalendarHeader()}
            {renderCalendarDays()}
            {renderCalendarGrid()}
            {renderSelectedDateEvents()}
          </>
        ) : (
          renderListView()
        )}
      </ScrollView>
      
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {logType === 'wear' ? 'Log Item Worn' : 'Log Item Washed'}
              </Text>
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
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
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
              <Check size={18} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.modalSubmitButtonText}>
                {logType === 'wear' ? 'Log Wear' : 'Log Wash'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeToggleButton: {
    backgroundColor: colors.background,
  },
  toggleButtonText: {
    fontSize: 14,
    color: colors.subtext,
    marginLeft: 4,
  },
  activeToggleButtonText: {
    color: colors.primary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  calendarNavButton: {
    padding: 8,
  },
  calendarNavButtonText: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '600',
  },
  calendarDaysHeader: {
    flexDirection: 'row',
    marginBottom: 8,
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
    marginBottom: 24,
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
    backgroundColor: colors.primary + '20',
    borderRadius: 8,
  },
  calendarToday: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 14,
    color: colors.text,
  },
  calendarSelectedDayText: {
    color: colors.primary,
    fontWeight: '600',
  },
  calendarTodayText: {
    color: colors.primary,
    fontWeight: '600',
  },
  calendarDayIndicators: {
    flexDirection: 'row',
    marginTop: 4,
  },
  calendarDayIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 1,
  },
  eventsContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
  },
  eventsDate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
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
  },
  modalSubmitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});