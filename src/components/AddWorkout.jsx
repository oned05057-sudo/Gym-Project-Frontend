import React, { useState, useEffect } from "react";
import { Plus, Calendar } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { getAllExercise } from "../serviceFunctions/userRelatedFunc.js";
import { setAllExercises } from "../redux/slices/dataSlice.js";
import AddSets from "./AddSets.jsx";

function AddWorkout({ day, addSingleDayRoutine, initialWorkouts = [], exercises = [] }) {
  const dispatch = useDispatch();
  const { totalExercies } = useSelector((state) => state.dataSlice);

  const [workouts, setWorkout] = useState([]);
  const [currDayExercise, setCurrentDayExercise] = useState([]);
  const [addExercise, setAddExercise] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [isSaved,setIsSaved]=useState(false);
  const [deleteBtn,setDeleteBtn]=useState(true);

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
    if (initialWorkouts && initialWorkouts.length > 0) {
      setWorkout(initialWorkouts);
      const mapped = initialWorkouts.map((w) => {
        const exId = w.Exercise || w.exerciseId || w.exercise;
        const exObj = (exercises || []).find((e) => String(e.id) === String(exId));
        return { id: exId, name: exObj ? exObj.name : '', sets: w.sets || [] };
      });
      setCurrentDayExercise(mapped);
      setIsSaved(true);
      setDeleteBtn(false);
    }
  }, [initialWorkouts, exercises]);

  function deleteWorkOut(value){
    setCurrentDayExercise(prev => prev.filter((item) => item.id !== value));
    setWorkout(prev=>prev.filter((item)=>item.Exercise !==value))
  }

  function addWorkOutHandler(sglWorlOut){
    setWorkout((prev)=>[...prev,sglWorlOut]);
  }

  function handleSaveForDay(){
    setIsSaved(true);
    setDeleteBtn(false);
    addSingleDayRoutine({ day, workouts });
  }

  return (
    <div className="border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <h4 className="text-lg font-medium text-card-foreground">{day}</h4>
        </div>
        <button
          type="button"
          onClick={() => setAddExercise(true)}
          className="flex items-center space-x-2 px-3 py-2 text-primary hover:text-primary-foreground hover:bg-primary/90 rounded-md"
        >
          <Plus className="h-4 w-4" />
          <span>Add Workout</span>
        </button>
      </div>

      {addExercise && (
        <div className="flex flex-col gap-y-2">
          <div className={`flex items-center space-x-4 p-4 bg-muted/50 ${isSaved ? "hidden":""}`}>
            <div className="flex-1">
              <select
                value={selectedExerciseId}
                onChange={(e) => {
                  const id = e.target.value;
                  const name = e.target.options[e.target.selectedIndex].text;
                  if (id) {
                    setCurrentDayExercise(prev => [...prev, { id, name }]);
                    setSelectedExerciseId('');
                  } else {
                    setSelectedExerciseId('');
                  }
                }}
                className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">Select Exercise...</option>
                {(exercises || []).map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setAddExercise(false)}
              className="text-destructive hover:font-bold hover:text-red-600 py-1 px-2 bg-red-300 rounded-sm"
            >
              
            </button>
          </div>
        </div>
      )}

      {currDayExercise.length > 0 ? (
        currDayExercise.map((initialExercise,index) => {
          const result = exercises.filter(ex => ex.id == initialExercise.id);
          return (
            <AddSets key={index} ex={initialExercise} deleteWorkOut={deleteWorkOut} addWorkOutHandler={addWorkOutHandler} deleteBtn={deleteBtn} exDetail={result[0]} />
          )
        })
      ) : (
        !addExercise && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No Workout added for {day}</p>
          </div>
        )
      )}

      <button
        className={`w-fit h-fit text-black font-bold hover:text-green-900 py-1 px-2 bg-green-400 rounded-sm mt-1 ${workouts.length===0 || isSaved ? "hidden":""}`}
        onClick={handleSaveForDay}
        type="button"
      >
        Save for the {day}
      </button>
    </div>
  );
}

export default AddWorkout;
