// ✅ Full AdminPage component with subject editing functionality
import React, { useRef, useEffect, useState } from "react";
import Papa from "papaparse";
import { db } from "../utils/firebase_store";
import {
  collection, onSnapshot, deleteDoc, doc,
  addDoc, updateDoc, serverTimestamp
} from "firebase/firestore";
import { auth } from "../utils/firebase_auth";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth
} from "firebase/auth";
import { useNavigate } from "react-router-dom";

const SUBJECTS = {
  "Elementary School": [
    "1st Grade", "2nd Grade", "3rd Grade", "4th Grade", "5th Grade",
    "Kindergarten", "Pre-Kindergarten"
  ].sort(),
  "Middle School": [
    "6th Grade Band", "6th Grade Computer Science", "6th Grade Creative Problem Solving",
    "6th Grade ELA", "6th Grade Physical Education", "6th Grade Science",
    "6th Grade Social Studies", "6th Grade Visual Arts", "Introduction to World Languages",
    "Math 6AB", "Math 6B/7AB", "Math 7AB", "Math 8AB", "Spanish 6", "Spanish I",
    "Spanish II", "7th Grade Band", "7th Grade Computer Science",
    "7th Grade Creative Problem Solving", "7th Grade ELA", "7th Grade Orchestra",
    "7th Grade Physical Education", "7th Grade Science", "7th Grade Social Studies",
    "7th Grade Visual Arts", "8th Grade Band", "8th Grade Computer Science",
    "8th Grade Creative Problem Solving", "8th Grade ELA", "8th Grade Orchestra",
    "8th Grade Physical Education", "8th Grade Science", "8th Grade Social Studies",
    "8th Grade Visual Arts", "Enhanced Algebra: Concepts and Connections"
  ].sort(),
  "High School": {
    "Math": ["Algebra: Concepts and Connections", "AP Calculus AB", "AP Calculus BC", "AP Precalculus", "AP Statistics", "Geometry: Concepts and Connections", "Multivariable Calculus", "Precalculus", "Statistics"].sort(),
    "Science": ["AP Biology", "AP Chemistry", "AP Environmental Science", "AP Physics C", "AP Physics I", "Biology", "Chemistry", "Forensics", "Human Anatomy & Physiology", "Physics I"].sort(),
    "English": ["Advanced Composition", "American Literature", "AP Language and Composition", "AP Literature and Composition", "British Literature and Composition", "World Literature"].sort(),
    "Social Studies": ["AP Human Geography", "AP Macroeconomics", "AP Psychology", "AP U.S. Government and Politics", "AP U.S. History", "AP World History", "U.S. History", "World History"].sort(),
    "Electives": ["AP Art and Design", "AP Music Theory", "Band", "Drama", "Orchestra", "Scientific Illustration", "Spanish I", "Spanish II", "Spanish III", "Spanish IV", "Turkish I", "Turkish II", "Turkish III", "Turkish IV"].sort()
  }
};

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newUser, setNewUser] = useState({
    firstName: "", lastName: "", email: "",
    password: "FSA123", subject: [], role: "",
    gradeLevel: "", courseCategory: ""
  });
  const [editingUser, setEditingUser] = useState(null);
  const [updatedUser, setUpdatedUser] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const firebaseAuth = getAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const allUsers = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUsers(allUsers);
      setFilteredUsers(allUsers);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const results = users.filter(user =>
      (user.firstName?.toLowerCase().includes(lowerCaseQuery) ||
        user.lastName?.toLowerCase().includes(lowerCaseQuery) ||
        user.email?.toLowerCase().includes(lowerCaseQuery))
    );
    setFilteredUsers(results);
  }, [searchQuery, users]);

  const handleGradeLevelChange = (e, isNew = false) => {
    const value = e.target.value;
    if (isNew) {
      setNewUser(prev => ({ ...prev, gradeLevel: value, courseCategory: "", subject: [] }));
    } else {
      setUpdatedUser(prev => ({ ...prev, gradeLevel: value, courseCategory: "", subject: [] }));
    }
  };

  const handleCourseCategoryChange = (e, isNew = false) => {
    const value = e.target.value;
    if (isNew) {
      setNewUser(prev => ({ ...prev, courseCategory: value, subject: [] }));
    } else {
      setUpdatedUser(prev => ({ ...prev, courseCategory: value, subject: [] }));
    }
  };

  const handleSubjectChange = (e, isNew = false) => {
    const { value, checked } = e.target;
    if (isNew) {
      setNewUser(prev => {
        const updatedSubjects = checked
          ? [...prev.subject, value]
          : prev.subject.filter(subject => subject !== value);
        return { ...prev, subject: updatedSubjects };
      });
    } else {
      setUpdatedUser(prev => {
        const updatedSubjects = checked
          ? [...prev.subject, value]
          : prev.subject.filter(subject => subject !== value);
        return { ...prev, subject: updatedSubjects };
      });
    }
  };

  const getAvailableSubjects = (gradeLevel, courseCategory) => {
    if (gradeLevel === "High School" && courseCategory) {
      return SUBJECTS["High School"][courseCategory] || [];
    }
    return SUBJECTS[gradeLevel] || [];
  };

  const renderSubjectsByGradeLevel = (gradeLevel, courseCategory, selectedSubjects, onChange) => {
    const availableSubjects = getAvailableSubjects(gradeLevel, courseCategory);
    return (
      <div>
        {gradeLevel === "High School" && (
          <div>
            <label>Select Course Category</label>
            <select value={courseCategory || ""} onChange={handleCourseCategoryChange}>
              <option value="">Select Category</option>
              {Object.keys(SUBJECTS["High School"]).map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        )}
        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
          {availableSubjects.map(subject => (
            <label key={subject}>
              <input
                type="checkbox"
                value={subject}
                checked={selectedSubjects.includes(subject)}
                onChange={onChange}
              />
              {subject}
            </label>
          ))}
        </div>
      </div>
    );
  };

  const handleAddUser = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, newUser.email, newUser.password);
      const uid = userCredential.user.uid;
      await addDoc(collection(db, "users"), {
        uid,
        ...newUser,
        role: newUser.role || 'teacher',
        subject: newUser.role === 'admin' ? ["Full Drive"] : newUser.subject,
        createdAt: serverTimestamp(),
        authProvider: "admin",
      });
      setIsAddModalOpen(false);
    } catch (error) {
      alert("Error adding user: " + error.message);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUpdatedUser(user);
    setIsModalOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      await updateDoc(doc(db, "users", editingUser.id), updatedUser);
      setIsModalOpen(false);
    } catch (error) {
      alert("Error saving user: " + error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await deleteDoc(doc(db, "users", userId));
    } catch (error) {
      alert("Error deleting user: " + error.message);
    }
  };

  return (
    <div>
      <h1>Admin Page</h1>
      <input
        type="text"
        placeholder="Search"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />
      <button onClick={() => setIsAddModalOpen(true)}>Add User</button>

      {isAddModalOpen && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <input placeholder="First Name" value={newUser.firstName} onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })} />
            <input placeholder="Last Name" value={newUser.lastName} onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })} />
            <input placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
            <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
              <option value="">Role</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
            {newUser.role === 'teacher' && (
              <>
                <select value={newUser.gradeLevel} onChange={(e) => handleGradeLevelChange(e, true)}>
                  <option value="">Select Grade Level</option>
                  <option value="Elementary School">Elementary School</option>
                  <option value="Middle School">Middle School</option>
                  <option value="High School">High School</option>
                </select>
                {renderSubjectsByGradeLevel(newUser.gradeLevel, newUser.courseCategory, newUser.subject, (e) => handleSubjectChange(e, true))}
              </>
            )}
            <button onClick={handleAddUser}>Save</button>
          </div>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Subjects</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => (
            <tr key={user.id}>
              <td>{user.firstName} {user.lastName}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{(user.subject || []).join(", ")}</td>
              <td>
                <button onClick={() => handleEditUser(user)}>Edit</button>
                <button onClick={() => handleDeleteUser(user.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <input placeholder="First Name" value={updatedUser.firstName} onChange={(e) => setUpdatedUser({ ...updatedUser, firstName: e.target.value })} />
            <input placeholder="Last Name" value={updatedUser.lastName} onChange={(e) => setUpdatedUser({ ...updatedUser, lastName: e.target.value })} />
            <input placeholder="Email" value={updatedUser.email} onChange={(e) => setUpdatedUser({ ...updatedUser, email: e.target.value })} />
            <select value={updatedUser.role} onChange={(e) => setUpdatedUser({ ...updatedUser, role: e.target.value })}>
              <option value="">Role</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
            {updatedUser.role === 'teacher' && (
              <>
                <select value={updatedUser.gradeLevel} onChange={(e) => handleGradeLevelChange(e)}>
                  <option value="">Select Grade Level</option>
                  <option value="Elementary School">Elementary School</option>
                  <option value="Middle School">Middle School</option>
                  <option value="High School">High School</option>
                </select>
                {renderSubjectsByGradeLevel(updatedUser.gradeLevel, updatedUser.courseCategory, updatedUser.subject, (e) => handleSubjectChange(e))}
              </>
            )}
            <button onClick={handleSaveUser}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
};

const modalStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
};

const modalContentStyle = {
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '8px',
  width: '400px'
};

export default AdminPage;
