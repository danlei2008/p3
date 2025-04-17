// ✅ 필요한 import 추가
import React, { useRef, useEffect, useState } from "react";
import Papa from "papaparse";
import { db } from "../utils/firebase_store";
import { collection, onSnapshot, deleteDoc, doc, addDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth } from "../utils/firebase_auth";
import { createUserWithEmailAndPassword, deleteUser, getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newUser, setNewUser] = useState({ firstName: "", lastName: "", email: "", password: "FSA123", role: "" });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [updatedUser, setUpdatedUser] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !file.name.endsWith(".csv")) {
      alert("Only CSV files are allowed.");
      return;
    }

    Papa.parse(file, {
      complete: async function (results) {
        const rows = results.data.filter(row => row.length >= 4);

        for (let i = 0; i < rows.length; i++) {
          const [firstName, lastName, email, role] = rows[i].map(v => v?.trim());

          if (!firstName || !lastName || !email || !role) {
            alert(`Row ${i + 1}: All fields (first name, last name, email, role) are required.`);
            return;
          }

          if (!/^[^\s@]+@gmail\.com$/.test(email)) {
            alert(`Row ${i + 1}: Invalid email format. Must end with @gmail.com.`);
            return;
          }

          if (!["Teacher", "Admin"].includes(role)) {
            alert(`Row ${i + 1}: Role must be either 'Teacher' or 'Admin'.`);
            return;
          }
        }

        for (let i = 0; i < rows.length; i++) {
          const [firstName, lastName, email, role] = rows[i].map(v => v.trim());
          const password = "FSA123";
          try {
            const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
            const uid = userCredential.user.uid;

            await addDoc(collection(db, "users"), {
              uid,
              firstName,
              lastName,
              email,
              password,
              subject: role === "Admin" ? ["Full Drive"] : [],
              role: role.toLowerCase(),
              authProvider: "admin",
              createdAt: serverTimestamp(),
              gradeLevel: "",
              courseCategory: "",
            });
          } catch (error) {
            console.error(`❌ Error processing ${email}:`, error.message);
            alert(`Error adding ${email}: ${error.message}`);
          }
        }
        alert("✅ All users uploaded successfully.");
      },
      error: (err) => {
        alert("Error parsing CSV file: " + err.message);
      },
    });
  };

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
    setNewUser({ firstName: "", lastName: "", email: "", password: "FSA123", role: "" });
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
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
        subject: newUser.role === "admin" ? ["Full Drive"] : [],
        role: newUser.role || 'teacher',
        authProvider: "admin",
        createdAt: serverTimestamp(),
        gradeLevel: "",
        courseCategory: "",
      });
      handleCloseAddModal();
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
      await updateDoc(doc(db, "users", editingUser.id), {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role,
      });
      setIsModalOpen(false);
    } catch (error) {
      alert("Error saving user: " + error.message);
    }
  };

  const handleResetPassword = async (userId) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        password: "FSA123",
      });
      alert("Password has been reset to default (FSA123)");
    } catch (error) {
      alert("Error resetting password: " + error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      alert("User deleted from Firestore.");
    } catch (error) {
      alert("Error deleting user: " + error.message);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div>
      <h1>Admin Page</h1>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <input
          type="text"
          placeholder="Search users by name or email"
          value={searchQuery}
          onChange={handleSearchChange}
          style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc', width: '300px' }}
        />
        <button onClick={handleOpenAddModal}>Add User</button>
        <button onClick={() => fileInputRef.current.click()}>CSV Bulk Upload</button>
        <input
          type="file"
          ref={fileInputRef}
          accept=".csv"
          style={{ display: "none" }}
          onChange={handleCSVUpload}
        />
      </div>

      {isAddModalOpen && (
        <div className="modal" style={modalStyle}>
          <div className="modal-content" style={modalContentStyle}>
            <h2>Add New User</h2>
            <input type="text" placeholder="First Name" value={newUser.firstName} onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })} />
            <input type="text" placeholder="Last Name" value={newUser.lastName} onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })} />
            <input type="email" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
            <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
              <option value="">Select Role</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
            <button onClick={handleAddUser}>Add</button>
            <button onClick={handleCloseAddModal}>Cancel</button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal" style={modalStyle}>
          <div className="modal-content" style={modalContentStyle}>
            <h2>Edit User</h2>
            <input type="text" value={updatedUser.firstName} onChange={(e) => setUpdatedUser({ ...updatedUser, firstName: e.target.value })} />
            <input type="text" value={updatedUser.lastName} onChange={(e) => setUpdatedUser({ ...updatedUser, lastName: e.target.value })} />
            <input type="email" value={updatedUser.email} onChange={(e) => setUpdatedUser({ ...updatedUser, email: e.target.value })} />
            <select value={updatedUser.role} onChange={(e) => setUpdatedUser({ ...updatedUser, role: e.target.value })}>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
            <button onClick={handleSaveUser}>Save</button>
            <button onClick={() => setIsModalOpen(false)}>Cancel</button>
          </div>
        </div>
      )}

      <table border="1" width="100%" style={{ borderCollapse: "collapse", textAlign: "left" }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'center' }}>First Name</th>
            <th style={{ textAlign: 'center' }}>Last Name</th>
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
                <button onClick={() => handleDeleteUser(user.id)} style={{ color: 'red' }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
