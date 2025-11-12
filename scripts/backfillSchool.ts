import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Usage: set GOOGLE_APPLICATION_CREDENTIALS env to your service account JSON
initializeApp();
const db = getFirestore();

async function backfill() {
  const SCHOOL = '한양여자대학교';
  let updated = 0;

  // 1) posts/{userId}/userPosts/*
  const usersSnap = await db.collection('posts').get();
  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const postsSnap = await db.collection('posts').doc(userId).collection('userPosts').get();
    for (const post of postsSnap.docs) {
      const data = post.data();
      if (!('school' in data) || !data.school) {
        await post.ref.set({ school: SCHOOL }, { merge: true });
        updated++;
      }
    }
  }

  // 2) chatRooms/*
  const roomsSnap = await db.collection('chatRooms').get();
  for (const room of roomsSnap.docs) {
    const data = room.data();
    if (!('school' in data) || !data.school) {
      await room.ref.set({ school: SCHOOL }, { merge: true });
      updated++;
    }
  }

  // 3) users/{uid}/likes/* and users/{uid}/viewed/*
  const usersCol = await db.collection('users').get();
  for (const u of usersCol.docs) {
    const uid = u.id;
    for (const sub of ['likes', 'viewed']) {
      const subSnap = await db.collection('users').doc(uid).collection(sub).get();
      for (const docSnap of subSnap.docs) {
        const data = docSnap.data();
        if (!('school' in data) || !data.school) {
          await docSnap.ref.set({ school: SCHOOL }, { merge: true });
          updated++;
        }
      }
    }
  }

  console.log(`Backfill complete. Updated docs: ${updated}`);
}

backfill().catch((e) => {
  console.error(e);
  process.exit(1);
});
