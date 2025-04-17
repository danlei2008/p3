import React, { useEffect, useState } from "react";
import { db } from "../utils/firebase_store";
import { collection, onSnapshot, deleteDoc, doc, addDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth } from "../utils/firebase_auth";
import { createUserWithEmailAndPassword, deleteUser, getAuth } from "firebase/auth";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import { driveLink } from "../utils/f_config";
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
  const [newUser, setNewUser] = useState({ firstName: "", lastName: "", email: "", password: "FSA123", subject: [], role: "", gradeLevel: "", courseCategory: "" });
  const [editingUser, setEditingUser] = useState(null);
  const [updatedUser, setUpdatedUser] = useState({ firstName: "", lastName: "", email: "", password: "", subject: [], role: "", gradeLevel: "", courseCategory: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const firebaseAuth = getAuth();
  const navigate = useNavigate();

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

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
    setNewUser({ firstName: "", lastName: "", email: "", password: "FSA123", subject: [], role: "", gradeLevel: "", courseCategory: "" });
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setNewUser({ firstName: "", lastName: "", email: "", password: "FSA123", subject: [], role: "", gradeLevel: "", courseCategory: "" });
  };

  const handleAddUser = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, newUser.email, newUser.password);
      const uid = userCredential.user.uid;
      await addDoc(collection(db, "users"), {
        uid,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        password: newUser.password,
        subject: newUser.role === 'admin' ? ["Full Drive"] : newUser.subject,
        role: newUser.role || 'teacher',
        authProvider: "admin",
        createdAt: serverTimestamp(),
        gradeLevel: newUser.gradeLevel,
        courseCategory: newUser.courseCategory,
      });
      handleCloseAddModal();
    } catch (error) {
      console.error("Error adding user:", error);
      alert(`Error adding user: ${error.message}`);
    }
  };

  const handleDeleteUser = async (userId, uid) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.uid === uid) {
        await deleteUser(currentUser);
        navigate('/login'); // Redirect to login after deleting current user
      }
      setUsers(users.filter((user) => user.id !== userId));
      setFilteredUsers(filteredUsers.filter((user) => user.id !== userId));
    } catch (error) {
      console.error("Error deleting user:", error);
      alert(`Error deleting user: ${error.message}`);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUpdatedUser({
      ...user,
      role: user.role || 'teacher',
      subject: user.subject || [],
      gradeLevel: user.gradeLevel || "",
      courseCategory: user.courseCategory || ""
    });
    setIsModalOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      await updateDoc(doc(db, "users", editingUser.id), {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        subject: updatedUser.role === 'admin' ? ["Full Drive"] : updatedUser.subject,
        role: updatedUser.role || 'teacher',
        gradeLevel: updatedUser.gradeLevel,
        courseCategory: updatedUser.courseCategory,
      });
      setIsModalOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error("Error saving user:", error);
      alert(`Error saving user: ${error.message}`);
    }
  };

  const handleResetPassword = async (userId) => {
    if (!window.confirm("Are you sure you want to reset this user's password to the default?")) return;
    try {
      await updateDoc(doc(db, "users", userId), {
        password: "FSA123",
      });
      alert("Password reset successfully.");
    } catch (error) {
      console.error("Error resetting password:", error);
      alert(`Error resetting password: ${error.message}`);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setUpdatedUser({ firstName: "", lastName: "", email: "", password: "", subject: [], role: "", gradeLevel: "", courseCategory: "" });
  };

  const handleGradeLevelChange = (e, isNew = false) => {
    const value = e.target.value;
    const currentSubjects = isNew ? newUser.subject : updatedUser.subject;
    let validSubjectsForLevel = [];

    if (SUBJECTS[value] && Array.isArray(SUBJECTS[value])) {
      validSubjectsForLevel = SUBJECTS[value];
    } else if (SUBJECTS[value] && typeof SUBJECTS[value] === 'object') {
      for (const category in SUBJECTS[value]) {
        if (Array.isArray(SUBJECTS[value][category])) {
          validSubjectsForLevel = validSubjectsForLevel.concat(SUBJECTS[value][category]);
        }
      }
    }

    const filteredSubjects = currentSubjects.filter(subject => validSubjectsForLevel.includes(subject));

    if (isNew) {
      setNewUser(prev => ({ ...prev, gradeLevel: value, courseCategory: "", subject: filteredSubjects }));
    } else {
      setUpdatedUser(prev => ({ ...prev, gradeLevel: value, courseCategory: "", subject: filteredSubjects }));
    }
  };

  const handleCourseCategoryChange = (e, isNew = false) => {
    const value = e.target.value;
    const currentSubjects = isNew ? newUser.subject : updatedUser.subject;
    const newSubjects = (isNew ? SUBJECTS["High School"][value] : SUBJECTS["High School"][value]) || [];
    const filteredSubjects = currentSubjects.filter(subject => newSubjects.includes(subject));

    if (isNew) {
      setNewUser(prev => ({ ...prev, courseCategory: value, subject: filteredSubjects }));
    } else {
      setUpdatedUser(prev => ({ ...prev, courseCategory: value, subject: filteredSubjects }));
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
    const isAdminRole = isAddModalOpen ? newUser.role === 'admin' : updatedUser.role === 'admin';
    const currentSelected = selectedSubjects || (isAddModalOpen ? newUser.subject : updatedUser.subject) || [];
    const allSubjectsToRender = Array.from(new Set([...availableSubjects, ...currentSelected]));

    if (isAdminRole) {
      return null;
    }

    return (
      <div>
        {gradeLevel === "High School" && (
          <div>
            <label>Select Course Category</label>
            <select
              value={courseCategory || ""}
              onChange={(e) => {
                const newCategory = e.target.value;
                const categorySubjects = SUBJECTS["High School"][newCategory] || [];
                const nextSubjects = currentSelected.filter(subject => categorySubjects.includes(subject));
                if (isAddModalOpen) {
                  setNewUser(prev => ({ ...prev, courseCategory: newCategory, subject: nextSubjects }));
                } else {
                  setUpdatedUser(prev => ({ ...prev, courseCategory: newCategory, subject: nextSubjects }));
                }
              }}
            >
              <option value="">Select Category</option>
              {Object.keys(SUBJECTS["High School"]).map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        )}

        {allSubjectsToRender.length > 0 && (
          <div>
            <label>Choose your Subjects</label>
            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #ccc', padding: '5px' }}>
              {allSubjectsToRender.map((subject) => (
                <div key={subject}>
                  <label>
                    <input
                      type="checkbox"
                      value={subject}
                      checked={currentSelected.includes(subject)}
                      onChange={onChange}
                    />
                    {subject}
                    {!availableSubjects.includes(subject) && !Object.values(SUBJECTS["High School"] || {}).flat().includes(subject) && (
                      <span style={{ fontStyle: 'italic', color: 'gray' }}>(Other)</span>
                    )}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
        {!gradeLevel && <p>Choose your subjects after selecting a grade level.</p>}
      </div>
    );
  };

  const handleRoleChangeNew = (e) => {
    const role = e.target.value;
    setNewUser(prev => ({ ...prev, role, subject: role === 'admin' ? ["Full Drive"] : [], gradeLevel: "", courseCategory: "" }));
  };

  const handleRoleChangeEdit = (e) => {
    const role = e.target.value;
    setUpdatedUser(prev => ({ ...prev, role, subject: role === 'admin' ? ["Full Drive"] : [], gradeLevel: "", courseCategory: "" }));
  };

  return (
    <div>
      <h1>Admin Page</h1>

      <div style={{ marginBottom: '15px' }}>
        <input
          type="text"
          placeholder="Search users by name or email"
          value={searchQuery}
          onChange={handleSearchChange}
          style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc', width: '300px' }}
        />
      </div>

      <button onClick={handleOpenAddModal}>Add User</button>

      {isAddModalOpen && (
        <div className="modal" style={modalStyle}>
          <div className="modal-content" style={modalContentStyle}>
            <h2>Add New User</h2>
            <input type="text" placeholder="First Name" value={newUser.firstName} onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })} />
            <input type="text" placeholder="Last Name" value={newUser.lastName} onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })} />
            <input type="email" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
            <select value={newUser.role} onChange={handleRoleChangeNew}>
              <option value="">Choose your role</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
            {newUser.role === 'teacher' && (
              <>
                <select value={newUser.gradeLevel} onChange={(e) => handleGradeLevelChange(e, true)}>
                  <option value="">Choose Subjects</option>
                  <option value="Elementary School">Elementary School</option>
                  <option value="Middle School">Middle School</option>
                  <option value="High School">High School</option>
                </select>
                {newUser.gradeLevel && renderSubjectsByGradeLevel(newUser.gradeLevel, newUser.courseCategory, newUser.subject, (e) => handleSubjectChange(e, true))}
                {!newUser.gradeLevel && <p>Choose your subjects after selecting a grade level.</p>}
              </>
            )}
            <button onClick={handleAddUser}>Add</button>
            <button onClick={handleCloseAddModal}>Cancel</button>
          </div>
        </div>
      )}

      <h2>User List</h2>
      <table border="1" width="100%" style={{ borderCollapse: "collapse", textAlign: "left" }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'center' }}>First Name</th>
            <th style={{textAlign: 'center' }}>Last Name</th>
            <th style={{ textAlign: 'center' }}>Email</th>
            <th style={{ textAlign: 'center' }}>Role</th>
            <th style={{ textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => (
            <tr key={user.id}>
              <td>{user.firstName || 'N/A'}</td>
              <td>{user.lastName || 'N/A'}</td>
              <td>{user.email || 'N/A'}</td>
              <td>{user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A'}</td>
              <td>
                <button onClick={() => handleEditUser(user)}>Edit</button>
                <button onClick={() => handleResetPassword(user.id)}>Reset Password</button>
                <button onClick={() => handleDeleteUser(user.id, user.uid)} style={{ color: 'red', fontWeight: 'bold' }}>X</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <div className="modal" style={modalStyle}>
          <div className="modal-content" style={modalContentStyle}>
            <h2>Edit User</h2>
            <input type="text" placeholder="First Name" value={updatedUser.firstName} onChange={(e) => setUpdatedUser({ ...updatedUser, firstName: e.target.value })} />
            <input type="text" placeholder="Last Name" value={updatedUser.lastName} onChange={(e) => setUpdatedUser({ ...updatedUser, lastName: e.target.value })} />
            <input type="email" placeholder="Email" value={updatedUser.email} onChange={(e) => setUpdatedUser({ ...updatedUser, email: e.target.value })} />
            <select value={updatedUser.role} onChange={handleRoleChangeEdit}>
              <option value="">Choose your role</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
            {updatedUser.role === 'teacher' && (
              <>
                <select value={updatedUser.gradeLevel} onChange={handleGradeLevelChange}>
                  <option value="">Choose Subjects</option>
                  <option value="Elementary School">Elementary School</option>
                  <option value="Middle School">Middle School</option>
                  <option value="High School">High School</option>
                </select>
                {updatedUser.gradeLevel && renderSubjectsByGradeLevel(updatedUser.gradeLevel, updatedUser.courseCategory, updatedUser.subject, handleSubjectChange)}
                {!updatedUser.gradeLevel && <p>Choose your subjects after selecting a grade level.</p>}
              </>
            )}
            <button onClick={handleSaveUser}>Save</button>
            <button onClick={handleModalClose}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

const modalStyle = {
  position: 'fixed',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const modalContentStyle = {
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '8px',
  width: '400px',
};

export default AdminPage;
