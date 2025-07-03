import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
  TextInput,
  FlatList
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import {
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const [location, setLocation] = useState('Fetching...');
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [newPost, setNewPost] = useState({
    image: '',
    title: '',
    category: '',
  });

  const [user, setUser] = useState({
    name: '',
    role: '',
    bio: '',
    avatar: '',
    followers: 0,
    following: 0,
    posts: 0,
    blocked: 0,
  });

  const fetchUserPosts = async (username) => {
    try {
      const q = query(collection(db, 'posts'), where('username', '==', username));
      const snapshot = await getDocs(q);
      const posts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUserPosts(posts);
    } catch (err) {
      console.log('Error fetching user posts:', err);
    }
  };

  const handleCreatePost = async () => {
    try {
      await addDoc(collection(db, 'posts'), {
        username: user.name || 'Anonymous',
        image: newPost.image,
        title: newPost.title,
        category: newPost.category,
        date: new Date().toDateString(),
        location: location || 'Unknown',
        views: 0,
        createdAt: serverTimestamp(),
      });
      alert('Post created!');
      setNewPost({ image: '', title: '', category: '' });
      setShowCreateForm(false);
      fetchUserPosts(user.name);
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post.');
    }
  };

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocation('Permission denied');
        } else {
          let loc = await Location.getCurrentPositionAsync({});
          let reverse = await Location.reverseGeocodeAsync({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });

          const place = reverse[0];
          const formatted = `${place.city}, ${place.region}`;
          setLocation(formatted);
        }
      } catch (err) {
        setLocation('Unable to get location');
      }

      try {
        const userRef = doc(db, 'users', 'abhinav');
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUser(userData);
          fetchUserPosts(userData.name);
        } else {
          console.log('No user found');
        }
      } catch (e) {
        console.log('Error fetching user:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#073b4c" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Feather name="menu" size={24} color="white" />
        <Text style={styles.logo}>BWstory</Text>
        <Feather name="search" size={22} color="white" />
      </View>

      <FlatList
        data={userPosts}
        numColumns={3}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Image source={{ uri: item.image }} style={styles.gridImage} />
        )}
        ListHeaderComponent={
          <View style={styles.profileCard}>
            {/* Profile Info */}
            <View style={styles.rowBetween}>
              <View style={styles.userInfo}>
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
                <View>
                  <Text style={styles.username}>{user.name}</Text>
                  <View style={styles.locationRow}>
                    <Feather name="map-pin" size={14} color="#555" />
                    <Text style={styles.locationText}>{location}</Text>
                  </View>
                  <View style={styles.locationRow}>
                    <Feather name="lock" size={14} color="#555" />
                    <Text style={styles.locationText}>{user.role}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.editBtn}>
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={styles.countsRow}>
              <TouchableOpacity style={styles.countBoxActive}>
                <Text style={styles.countText}>Trash</Text>
              </TouchableOpacity>
              <View style={styles.countBox}><Text>{user.posts}</Text><Text style={styles.label}>Feed</Text></View>
              <View style={styles.countBox}><Text>{user.followers}</Text><Text style={styles.label}>Followers</Text></View>
              <View style={styles.countBox}><Text>{user.following}</Text><Text style={styles.label}>Following</Text></View>
              <View style={styles.countBox}><Text>{user.blocked}</Text><Text style={styles.label}>Blocked</Text></View>
            </View>

            {/* About Me */}
            <Text style={styles.aboutTitle}>About me</Text>
            <Text style={styles.aboutText}>{user.bio}</Text>

            {/* Actions */}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.actionBtn}><Text style={styles.btnText}>Drafts</Text></TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setShowCreateForm(!showCreateForm)}>
                <Text style={styles.btnText}>{showCreateForm ? 'Cancel' : 'Create Post'}</Text>
              </TouchableOpacity>
            </View>

            {/* Create Form */}
            {showCreateForm && (
              <View style={styles.createForm}>
                <TextInput
                  style={styles.input}
                  placeholder="Image URL"
                  value={newPost.image}
                  onChangeText={(text) => setNewPost({ ...newPost, image: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Title"
                  value={newPost.title}
                  onChangeText={(text) => setNewPost({ ...newPost, title: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Category"
                  value={newPost.category}
                  onChangeText={(text) => setNewPost({ ...newPost, category: text })}
                />
                <TouchableOpacity style={styles.createPostBtn} onPress={handleCreatePost}>
                  <Text style={styles.btnText}>Submit</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.aboutTitle}>My Posts</Text>
            {userPosts.length === 0 && (
              <Text style={styles.noPost}>No Posts Yet</Text>
            )}
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#073b4c',
    paddingTop: Platform.OS === 'android' ? 40 : 50,
    paddingBottom: 12,
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  profileCard: { padding: 16 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#073b4c',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  username: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  locationText: { fontSize: 13, marginLeft: 4, color: '#555' },
  editBtn: {
    backgroundColor: '#073b4c',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  editText: { color: 'white', fontWeight: '600' },
  countsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    justifyContent: 'space-between',
  },
  countBox: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 4,
  },
  countBoxActive: {
    backgroundColor: '#073b4c',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 4,
  },
  countText: { color: 'white', fontWeight: '600' },
  label: { fontSize: 12, color: '#777' },
  aboutTitle: { fontWeight: 'bold', fontSize: 16, marginVertical: 10 },
  aboutText: { fontSize: 14, marginBottom: 16, color: '#555' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  actionBtn: {
    backgroundColor: '#073b4c',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  btnText: { color: 'white', fontWeight: '600' },
  noPost: { textAlign: 'center', color: '#555', marginTop: 10 },
  createForm: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  input: {
    backgroundColor: 'white',
    padding: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
  },
  createPostBtn: {
    backgroundColor: '#073b4c',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  gridImage: {
    width: width / 3 - 12,
    height: width / 3 - 12,
    margin: 4,
    borderRadius: 8,
    backgroundColor: '#ccc',
  },
});
