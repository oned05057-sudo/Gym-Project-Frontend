import React, { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar.jsx";
import { Save } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { getMembers, createUserTest } from "../serviceFunctions/userRelatedFunc.js";
import { setUsers } from "../redux/slices/dataSlice.js";
import ViewTest from "../components/ViewTest.jsx";

const CreateTest = () => {
  const dispatch = useDispatch();
  const { totalMembers } = useSelector((state) => state.dataSlice);

  const [members, setMembers] = useState(totalMembers || []);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [testData, setTestData] = useState([]);
  const [saving, setSaving] = useState(false);
  const memberInputRef = useRef(null);

  // close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (memberInputRef.current && !memberInputRef.current.contains(e.target)) {
        setShowMemberDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // fetch members if not already loaded
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

  // add new test entry
  const addTest = () => {
    setTestData([...testData, { exercise: "", result: "", unit: "" }]);
  };

  const handleChange = (index, field, value) => {
    const updated = [...testData];
    updated[index][field] = value;
    setTestData(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMember || testData.length === 0) return;

    setSaving(true);
    try {
      await createUserTest(selectedMember, testData);
      alert("Test created successfully!");
      setSelectedMember("");
      setTestData([]);
      setMemberSearch("");
    } catch (err) {
      console.error("Error creating test:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="max-w-5xl mx-auto py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Create Test</h1>

        <form onSubmit={handleSubmit} className="bg-card p-8 rounded-xl border border-border shadow-sm space-y-8">
          {/* Member selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Select Member</label>
            <div className="relative" ref={memberInputRef}>
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => {
                  const v = e.target.value;
                  setMemberSearch(v);
                  setShowMemberDropdown(true);
                  if (v === "") setSelectedMember("");
                }}
                onFocus={() => setShowMemberDropdown(true)}
                placeholder="Search member..."
                className="w-full px-3 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              {showMemberDropdown && (
                <ul className="absolute z-20 mt-1 max-h-40 w-full overflow-auto bg-card border border-border rounded-md shadow-lg">
                  {members
                    .filter((m) =>
                      m.name.toLowerCase().includes(memberSearch.toLowerCase())
                    )
                    .map((member) => (
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
                        {member.name}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>

          {/* Measurement display */}
          {selectedMember && (
            <div className="bg-muted p-4 rounded-lg border border-border text-sm">
              {(() => {
                const selected = members.find((m) => m.enrollmentId === selectedMember);
                if (!selected) return null;
                return (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-muted-foreground">
                    <p><strong>Height:</strong> {selected.height ? `${selected.height} cm` : "N/A"}</p>
                    <p><strong>Weight:</strong> {selected.weight ? `${selected.weight} kg` : "N/A"}</p>
                    <p><strong>BMI:</strong> {selected.bmi || "N/A"}</p>
                    <p><strong>Age:</strong> {selected.age || "N/A"}</p>
                    <p><strong>Gender:</strong> {selected.gender || "N/A"}</p>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Test inputs */}
          <div>
            <label className="block text-sm font-medium mb-2">Add Test Results</label>
            <button
              type="button"
              onClick={addTest}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg"
            >
              + Add Test
            </button>

            {testData.length > 0 && (
              <div className="mt-4 space-y-4">
                {testData.map((test, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      value={test.exercise}
                      onChange={(e) => handleChange(index, "exercise", e.target.value)}
                      placeholder="Exercise Name"
                      className="w-full px-3 py-2 border border-border rounded-lg"
                      required
                    />
                    <input
                      type="number"
                      value={test.result}
                      onChange={(e) => handleChange(index, "result", e.target.value)}
                      placeholder="Result"
                      className="w-full px-3 py-2 border border-border rounded-lg"
                      required
                    />
                    <input
                      type="text"
                      value={test.unit}
                      onChange={(e) => handleChange(index, "unit", e.target.value)}
                      placeholder="Unit (e.g. kg, sec)"
                      className="w-full px-3 py-2 border border-border rounded-lg"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || !selectedMember || testData.length === 0}
              className="flex items-center space-x-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground py-3 px-6 rounded-lg hover:from-primary/90 hover:to-secondary/90 disabled:opacity-50"
            >
              <Save className="h-5 w-5" />
              <span>{saving ? "Creating..." : "Create Test"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTest;
