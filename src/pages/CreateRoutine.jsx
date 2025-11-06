import React, { useState, useEffect, useRef } from 'react';
import { Save } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import AddWorkout from '../components/AddWorkout.jsx';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserTests, flattenExerciseList, UserAvailableExercises, getMembers, getAllExercise } from '../serviceFunctions/userRelatedFunc.js';
import { setUsers, setAllExercises } from '../redux/slices/dataSlice.js';
import ViewTest from '../components/ViewTest.jsx';
import { routinesApi } from '../mocks/mockApi.js';

const CreateRoutine = () => {
  const dispatch = useDispatch();
  const { totalMembers, totalExercies } = useSelector((state) => state.dataSlice);

  const [members, setMembers] = useState(totalMembers || []);
  const [memberSearch, setMemberSearch] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [selectedMember, setSelectedMember] = useState('');
  const [routineName, setRoutineName] = useState('');
  const [selectedDays, setSelectedDays] = useState({});
  const [saving, setSaving] = useState(false);
  const [showTestTable, setShowTestTable] = useState([]);

  const memberInputRef = useRef(null);
  const daysOfWeek = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6'];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (memberInputRef.current && !memberInputRef.current.contains(e.target)) setShowMemberDropdown(false);
    };
    const handleKey = (e) => { if (e.key === 'Escape') setShowMemberDropdown(false); };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  useEffect(() => {
    if (!totalMembers || totalMembers.length === 0) {
      const run = async () => {
        const data = await getMembers();
        dispatch(setUsers(data));
        setMembers(data);
      };
      run();
    }
  }, [totalMembers, dispatch]);

  useEffect(() => {
    if (!totalExercies || totalExercies.length === 0) {
      const run = async () => {
        const data = await getAllExercise();
        dispatch(setAllExercises(data));
      };
      run();
    }
  }, [totalExercies, dispatch]);

  useEffect(() => {
    if (!selectedMember) return;
    const run = async () => {
      const data = await fetchUserTests(selectedMember);
      setShowTestTable(flattenExerciseList(data));
    };
    run();
  }, [selectedMember]);

  const addSingleDayRoutine = (obj) => {
    setSelectedDays(prev => {
      const next = { ...prev };
      next[obj.day] = obj.workouts ? JSON.parse(JSON.stringify(obj.workouts)) : [];

      // Auto-copy Day 1->4, 2->5, 3->6
      const idx = daysOfWeek.indexOf(obj.day);
      if (idx >= 0 && idx < 3) {
        const mappedDay = daysOfWeek[idx + 3];
        next[mappedDay] = obj.workouts ? JSON.parse(JSON.stringify(obj.workouts)) : [];
      }

      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMember || !routineName) return;

    const filteredDays = Object.entries(selectedDays).reduce((acc, [day, exercises]) => {
      const validExercises = exercises.filter(ex => ex.id);
      if (validExercises.length > 0) acc[day] = validExercises;
      return acc;
    }, {});

    setSaving(true);
    try {
      await routinesApi.create({
        memberId: selectedMember,
        name: routineName,
        days: filteredDays,
      });

      setSelectedMember('');
      setRoutineName('');
      setSelectedDays({});
      setMemberSearch('');
    } catch (err) {
      console.error('Failed to create routine:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-2">Create Routine</h1>
        <p className="mb-6 text-muted-foreground">Design workout routines for your members</p>

        <form onSubmit={handleSubmit} className="space-y-8 bg-card rounded-xl shadow-sm border border-border p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div ref={memberInputRef}>
              <label className="block text-sm font-medium mb-2">Select Member</label>
              <input
                type="text"
                value={memberSearch}
                onChange={e => { setMemberSearch(e.target.value); setShowMemberDropdown(true); if (!e.target.value) setSelectedMember(''); }}
                onFocus={() => setShowMemberDropdown(true)}
                placeholder="Search or choose a member..."
                className="w-full px-3 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
              {showMemberDropdown && (
                <ul className="absolute z-20 mt-1 max-h-32 w-full overflow-auto rounded-md bg-card border border-border shadow-lg">
                  {members.filter(m => m.name.toLowerCase().includes(memberSearch.toLowerCase())).map(m => (
                    <li
                      key={m.id}
                      onMouseDown={e => { e.preventDefault(); setSelectedMember(m.enrollmentId); setMemberSearch(m.name); setShowMemberDropdown(false); }}
                      className="cursor-pointer px-3 py-2 hover:bg-muted-foreground/10"
                    >{m.name}</li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Routine Name</label>
              <input
                type="text"
                value={routineName}
                onChange={e => setRoutineName(e.target.value)}
                placeholder="e.g., Strength Training - Week 1"
                className="w-full px-3 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
          </div>

          {selectedMember && showTestTable.length > 0 && <ViewTest exercisesTested={showTestTable} reTest={false} />}

          <div>
            <h3 className="text-lg font-medium text-card-foreground mb-6">Weekly Schedule</h3>
            <div className="space-y-6">
              {daysOfWeek.map(day => (
                <AddWorkout
                  key={day}
                  day={day}
                  addSingleDayRoutine={addSingleDayRoutine}
                  initialWorkouts={selectedDays[day] || []}
                  exercises={totalExercies || []}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || !selectedMember || !routineName}
              className="flex items-center space-x-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-medium py-3 px-6 rounded-lg hover:from-primary/90 hover:to-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-5 w-5" />
              <span>{saving ? 'Creating...' : 'Create Routine'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoutine;
