import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { db } from "./firebase_store";
import { firebaseConfig } from "./f_config";
import {
  addDoc,
  collection,
  getDoc,
  setDoc,
  doc,
  query,
  where,
  getDocs,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";

// Initialize Firebase app
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// 🔹 전체 회원 조회
const getAllUsers = async () => {
  const usersRef = collection(db, "users");
  const querySnapshot = await getDocs(usersRef);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// 🔹 사용자 정보 업데이트
const updateUser = async (id, updatedData) => {
  try {
    await updateDoc(doc(db, "users", id), updatedData);
    console.log(`User ${id} updated successfully!`);
  } catch (error) {
    console.error("Error updating user:", error);
  }
};

// 🔹 사용자 삭제
const deleteUser = async (id) => {
  try {
    await deleteDoc(doc(db, "users", id));
    console.log(`User ${id} deleted successfully!`);
  } catch (error) {
    console.error("Error deleting user:", error);
  }
};

// 🔹 로그인
const signIn = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      console.log("사용자 정보:", userData);

      if (userData.subject.length === 0) {
        alert("You don't have any subject");
        return false;
      }

      localStorage.setItem("subject", JSON.stringify(userData.subject));
    } else {
      console.log("해당 이메일의 사용자를 찾을 수 없습니다.");
    }

    alert("Sign in success");
    return true;
  } catch (error) {
    alert("Check your email or password");
    console.error(error);
    return false;
  }
};

// 🔹 Google 로그인
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", result.user.email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      alert("User already exists");
      return false;
    }

    await addDoc(collection(db, "users"), {
      email: result.user.email,
      authProvider: "google",
      password: "",
      createdAt: new Date(),
      subject: [],
    });

    alert("Sign up success");
    return true;
  } catch (error) {
    alert(error);
    console.error(error);
    return false;
  }
};

// 🔹 회원가입 (with Firestore check first)
const signUp = async ({
  email,
  password,
  firstName,
  lastName,
  role,
  subject,
  authProvider,
}) => {
  try {
    if (!email) {
      alert("Email is required");
      return false;
    }

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      alert("User already exists");
      return false;
    }

    const result = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", result.user.uid), {
      email,
      password,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      role,
      subject,
      authProvider,
      createdAt: new Date(),
    });

    alert("Sign up success");
    return true;
  } catch (error) {
    alert(`Sign up failed: ${error.message}`);
    console.error("Sign up error:", error);
    return false;
  }
};

export { signUp };


export {
  auth,
  signInWithGoogle,
  signIn,
  signUp,
  getAllUsers,
  updateUser,
  deleteUser,
};
