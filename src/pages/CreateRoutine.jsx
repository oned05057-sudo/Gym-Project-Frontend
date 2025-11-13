import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Plus, Minus, Save, Calendar } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { membersApi, exercisesApi, routinesApi } from '../mocks/mockApi.js';
import AddWorkout from '../components/AddWorkout.jsx';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserTests, flattenExerciseList, getAllExercise, getMembers, UserAvailableExercises } from '../serviceFunctions/userRelatedFunc.js';
import { setAllExercises, setUsers } from '../redux/slices/dataSlice.js';
import ViewTest from '../components/ViewTest.jsx';
import toast from 'react-hot-toast';

const CreateRoutine = () => {
  const dispatch = useDispatch();
  const {totalMembers}=useSelector((state)=>state.dataSlice)
  const {totalExercies}=useSelector((state)=>state.dataSlice)
  const [members, setMembers] = useState(totalMembers);
  const [memberSearch, setMemberSearch] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [exercises, setExercises] = useState(totalExercies);
  const [selectedMember, setSelectedMember] = useState('');
  const [routineName, setRoutineName] = useState('');
  const [selectedDays, setSelectedDays] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const memberInputRef = useRef(null);
  const [availableExercise,setAvailableExercise]=useState(exercises);
  const [editInitialWorkOut,setInitialWorkOut]=useState(true);

  const [showTestTable,setShowTestTable]=useState();
  
//  console.log(selectedMember)
  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(e) {
      if (memberInputRef.current && !memberInputRef.current.contains(e.target)) {
        setShowMemberDropdown(false);
      }
    }

    function handleKey(e) {
      if (e.key === 'Escape') setShowMemberDropdown(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  useEffect(()=>{
    const run=async()=>{
      const data=await fetchUserTests(selectedMember);
      // const newData=flattenExerciseList(data);
      // const exer=UserAvailableExercises(data);
      const obj={
        "maxWeight":data.maxWeight,
        "maxReps":data.maxReps
      }
      setShowTestTable(obj);
      setAvailableExercise(exercises);
    }
    if(selectedMember){
      console.log("seleted mem",selectedMember)
      run();
    }
  },[selectedMember])

  // Keep the input text in sync when selectedMember is set programmatically
  useEffect(() => {
    if (selectedMember) {
      const m = (members || []).find(x => x.enrollmentId === selectedMember);
      if (m) setMemberSearch(m.name);
    }
  }, [selectedMember, members]);
  

  const daysOfWeek = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6'];

  useEffect(() => {
    if (!totalMembers || totalMembers.length === 0) {
      const run=async()=>{
        const data=await getMembers();
        dispatch(setUsers(data))
        setMembers(data)
        const data2=await getAllExercise();
        dispatch(setAllExercises(data2))
        setExercises(data2)
      }
      run();
    }
  }, [totalMembers, dispatch]);




  const [weekRoutine,setWeekRoutine]=useState([]);

  function addSingleDayRoutine(obj){
    // obj -> { day: 'Monday', workouts: [...] }
    console.log("Single day workout in createRoutine",obj)
    // keep the existing array (for any other usage)
    setWeekRoutine((prev) => {
      // replace existing entry for same day if present
      const others = prev.filter(p => p.day !== obj.day);
      return [...others, obj];
    });

    // also store in selectedDays (used on submit)
    setSelectedDays((prev) => {
      const next = { ...prev };
      next[obj.day] = obj.workouts || [];

      // duplicate mapping: Monday->Thursday, Tuesday->Friday, Wednesday->Saturday
      const idx = daysOfWeek.indexOf(obj.day);
      if (idx >= 0 && idx < 3) {
        const mappedDay = daysOfWeek[idx + 3];
        // clone the workouts array so further edits don't mutate both references
        next[mappedDay] = obj.workouts ? JSON.parse(JSON.stringify(obj.workouts)) : [];
      }

      return next;
    });
  }

  function handleInitialEdit() {
    setInitialWorkOut(false);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedMember || !routineName){ 
      toast.error("Choose member and Routine name");
      return;
    }

    
    // console.log("Week Routine is",weekRoutine);
    const inDay=[];
    for(let i of weekRoutine){
      if(daysOfWeek.includes(i.day)){
        inDay.push(i.day);
      }
    }
    const remainDay=[];
    for(let i of daysOfWeek){
      if(!inDay.includes(i)){
        remainDay.push(i);
      }
    }
    
    for(let day of remainDay){
      if(day === 'Day 4'){
        for(let i of weekRoutine){
          if(i.day === 'Day 1'){
            let obj={
              day:'Day 4',
              workouts:i.workouts
            }
            weekRoutine.push(obj);
            break;
          }
        }
      }
      if(day === 'Day 5'){
        for(let i of weekRoutine){
          if(i.day === 'Day 2'){
            let obj={
              day:'Day 5',
              workouts:i.workouts
            }
            weekRoutine.push(obj);
            break;
          }
        }
      }
      if(day === 'Day 6'){
        for(let i of weekRoutine){
          if(i.day === 'Day 3'){
            let obj={
              day:'Day 6',
              workouts:i.workouts
            }
            weekRoutine.push(obj);
            break;
          }
        }
      }
    }
    const newRoutine = weekRoutine.sort((a, b) => {
      const dayA = parseInt(a.day.replace("Day ", ""), 10);
      const dayB = parseInt(b.day.replace("Day ", ""), 10);
      return dayA - dayB;
    });


    if(weekRoutine.length !== 6){
      toast.error("Add Workout for Each days")
      return ;
    }
    console.log("Week Routine is",newRoutine);

    const pdfObj = {
      Member: selectedMember,
      Name: routineName,
      WeekRoutine:newRoutine,
    };
    generateRoutinePdf(pdfObj);
    setSaving(true);
    try {
      // NOTE: backend call intentionally omitted. Caller will send `payload` to backend later.

      // Update local state to the normalized week routine so UI reflects what was "saved"
      // setWeekRoutine(newWeekRoutine.length > 0 ? newWeekRoutine : weekRoutine);

      // Reset form fields
      setSelectedMember('');
      setRoutineName('');
      setSelectedDays({});

      // Generate printable routine based on normalized week routine
      
    } catch (err) {
      console.error('Error while preparing routine:', err);
    } finally {
      setSaving(false);
    }
  };

  // Generate a printable HTML for the weekly routine and open print dialog.
  // We intentionally avoid adding a new PDF library and use the browser print flow
  // so users can save or share the PDF from their browser.
  function generateRoutinePdf(routineObj) {
    try {
      const { Member, Name, WeekRoutine } = routineObj || {};
      const routineName = Name || 'Routine';
      const memberId = Member || '';
      const memberObj = (members || []).find(m => m.enrollmentId === memberId) || null;
      const memberName = memberObj ? memberObj.name : memberId;

      const style = `
        body { font-family: Arial, Helvetica, sans-serif; padding: 20px; color: #111; }
        h1 { margin-bottom: 6px }
        h2 { margin: 18px 0 8px 0; border-bottom: 1px solid #eee; padding-bottom: 4px }
        .meta { margin-bottom: 12px; }
        .exercise { margin: 8px 0; }
        .exercise-name { font-weight: 700; margin-bottom: 4px }
        .set-row { margin-left: 12px; font-size: 14px }
      `;

      function renderSetsHtml(sets) {
        if (!Array.isArray(sets) || sets.length === 0) return `<div class="set-row">No sets</div>`;
        return sets.map((s, i) => {
          const setNo = s.setNo ?? s.set ?? (i + 1);
          const weight = s.weight ?? s.weightKG ?? '-';
          const reps = s.reps ?? '-';
          return `<div class="set-row">Set ${setNo}: ${weight} kg x ${reps} reps</div>`;
        }).join('');
      }

      let html = `<!doctype html><html><head><meta charset="utf-8"><title>${routineName}</title><style>${style}</style></head><body>`;
      html += `<h1>${routineName}</h1>`;
      html += `<div class="meta"><strong>Member:</strong> ${memberName} <br/><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>`;

      // WeekRoutine is an array of { day, workouts }
      if (Array.isArray(WeekRoutine) && WeekRoutine.length > 0) {
        for (const dayObj of WeekRoutine) {
          const day = dayObj.day || 'Day';
          const workouts = dayObj.workouts || [];
          html += `<h2>${day}</h2>`;
          if (workouts.length === 0) {
            html += `<div class="exercise">No exercises</div>`;
            continue;
          }
          for (const w of workouts) {
            // Accept shapes: { Exercise, sets }, { id, name, sets }, { exerciseId, sets }
            const exId = w.Exercise || w.id || w.exerciseId || (w.exercise && w.exercise.id) || null;
            const exName = w.name || (availableExercise || []).find(a => String(a.id) === String(exId))?.name || exId || 'Unknown Exercise';
            html += `<div class="exercise"><div class="exercise-name">${exName}</div>`;
            html += renderSetsHtml(w.sets || []);
            html += `</div>`;
          }
        }
      } else {
        html += `<div>No week routine available</div>`;
      }

      html += `<div style="font-size:12px; color:#666; margin-top:18px;">Generated by Gym app</div>`;
      html += `</body></html>`;

      const printWindow = window.open('', '_blank', 'width=900,height=700');
      if (!printWindow) {
        alert('Popup blocked. Allow popups for this site to download the routine PDF.');
        return;
      }
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 600);
    } catch (err) {
      console.error('Failed to generate routine PDF', err);
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create Routine</h1>
          <p className="mt-2 text-muted-foreground">Design workout routines for your members</p>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-border p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">
                    Select Member
                  </label>
                  <div className="relative" ref={memberInputRef}>
                    <input
                      type="text"
                      value={memberSearch}
                      onChange={(e) => {
                        const v = e.target.value;
                        setMemberSearch(v);
                        setShowMemberDropdown(true);
                        if (v === '') {
                          // clear selected when user empties the input
                          setSelectedMember('');
                        }
                      }}
                      onFocus={() => setShowMemberDropdown(true)}
                      placeholder="Search or choose a member..."
                      className="w-full px-3 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      aria-label="Search members"
                      required
                    />

                    {showMemberDropdown && (
                      <ul className="absolute z-20 mt-1 max-h-32 w-full overflow-auto rounded-md bg-card border border-border shadow-lg">
                        {(members || []).filter(m => {
                          const q = (memberSearch || '').toLowerCase();
                          return (
                            !q ||
                            m.name.toLowerCase().includes(q) ||
                            (m.enrollmentId && String(m.enrollmentId).toLowerCase().includes(q))
                          );
                        }).map(member => (
                          <li
                            key={member.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSelectedMember(member.enrollmentId);
                              setMemberSearch(member.name);
                              setShowMemberDropdown(false);
                            }}
                            className="cursor-pointer px-3 py-2 hover:bg-muted-foreground/10"
                          >
                            <div className="flex justify-between">
                              <span>{member.name}</span>
                            </div>
                          </li>
                        ))}
                        {(members || []).length === 0 && (
                          <li className="px-3 py-2 text-sm text-muted-foreground">No members</li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">
                    Routine Name
                  </label>
                  <input
                    type="text"
                    value={routineName}
                    onChange={(e) => setRoutineName(e.target.value)}
                    className="w-full px-3 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., Strength Training - Week 1"
                    required
                  />
                </div>
              </div>
              <div className='text-xl pt-3'>
                {selectedMember && (
                  <div className="mt-4 bg-muted p-4 rounded-lg border border-border">
                    {(() => {
                      const selected = members.find(
                        (m) => m.enrollmentId === selectedMember
                      );
                      if (!selected) return null;
                      return (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <p>
                            <strong>Height:</strong>{" "}
                            {selected.height ? `${selected.height} cm` : "N/A"}
                          </p>
                          <p>
                            <strong>Weight:</strong>{" "}
                            {selected.weight ? `${selected.weight} kg` : "N/A"}
                          </p>
                          {/* <p>
                            <strong>BMI:</strong> {(selected.weight / ((selected.height / 100) ** 2)).toFixed(2)}
                          </p> */}
                          <p>
                            <strong>Age:</strong> {selected.age || "N/A"}
                          </p>
                          <p>
                            <strong>Gender:</strong> {selected.gender || "N/A"}
                          </p>
                        </div>
                      );
                    })()}
                    {selectedMember && showTestTable && 
                    <div className='bg-muted  mt-3'>
                      {/* <div className='text-base text-slate-300 font-bold '>Capabilities</div> */}
                      <div className='flex text-sm justify-between text-muted-foreground '>
                        <div className='flex w-[50%] gap-x-2'>
                          <div className='font-semibold'>Global Maximum Weight : </div>
                          <div>{`${showTestTable.maxWeight} KG`}</div>
                        </div>
                        <div className='flex w-[50%] gap-x-2'>
                          <div className='font-semibold'>Global Maximum Reps: </div>
                          <div>{`${showTestTable.maxReps} Reps`}</div>
                        </div>
                      </div>
                    </div>}
                    

                  </div>
                )}
                
              </div>
            </div>
              

            {/* Days and Exercises */}
            <div>
              <h3 className="text-lg font-medium text-card-foreground mb-6">Weekly Schedule</h3>
              
              { 
                <div className="space-y-6">
                {daysOfWeek.map((day,index) => {
                  let res=(day === 'Day 4' || day === 'Day 5' || day === 'Day 6') && editInitialWorkOut;
                  return (<AddWorkout
                    key={day}
                    day={day}
                    index={index}
                    addSingleDayRoutine={addSingleDayRoutine}
                    initialWorkouts={selectedDays[day] || []}
                    selectedMember={selectedMember}
                    exercises={availableExercise}
                    capabilites={showTestTable}
                    editInitialWorkOut={res}
                    handleInitialEdit={handleInitialEdit}
                  />)
                })}
              </div>}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving || !selectedMember || !routineName }
                className="flex items-center space-x-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-medium py-3 px-6 rounded-lg hover:from-primary/90 hover:to-secondary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-5 w-5" />
                <span>{saving ? 'Creating...' : 'Create Routine'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateRoutine;





