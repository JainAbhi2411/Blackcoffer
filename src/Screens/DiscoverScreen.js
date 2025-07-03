import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Feather, Entypo } from '@expo/vector-icons';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Platform } from 'react-native';

const { width } = Dimensions.get('window');
const categories = ['All', 'Entertainment', 'Lifestyle', 'Travel', 'Tech', 'Food'];

export default function DiscoverScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState([]);
  const [lastVisible, setLastVisible] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const pageSize = 5;

  const loadInitialPosts = useCallback(() => {
    setLoading(true);
    const q = query(collection(db, 'posts'), orderBy('date', 'desc'), limit(pageSize));
    const unsubscribe = onSnapshot(q, snapshot => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFeed(fetched);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsub = loadInitialPosts();
    return () => unsub();
  }, []);

  const loadMorePosts = async () => {
    if (!lastVisible) return;
    const q = query(
      collection(db, 'posts'),
      orderBy('date', 'desc'),
      startAfter(lastVisible),
      limit(pageSize)
    );
    const snapshot = await getDocs(q);
    const newPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setFeed(prev => [...prev, ...newPosts]);
    setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
  };

  const handleLike = (postId) => {
    setLikedPosts(prev =>
      prev.includes(postId)
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const handleComment = (postId) => {
    console.log('Comment clicked:', postId);
  };

  const handleShare = async (item) => {
    try {
      await Share.share({ message: `${item.title}\n${item.image}` });
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const renderCategoryItem = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat}
          style={[styles.categoryButton, selectedCategory === cat && styles.categoryActive]}
          onPress={() => setSelectedCategory(cat)}
        >
          <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>{cat}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderFeedItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.userRow}>
        <Feather name="user" size={20} color="#0369a1" />
        <Text style={styles.username}>{item.username}</Text>
      </View>
      <Image source={{ uri: item.image }} style={styles.postImage} />
      <View style={styles.postDetails}>
        <Text style={styles.metaText}>{item.date} | Media | {item.views} Views</Text>
        <Text style={styles.postTitle}>{item.title}</Text>
        <View style={styles.iconRow}>
          <TouchableOpacity onPress={() => handleLike(item.id)}>
            <Feather name="heart" size={20} color={likedPosts.includes(item.id) ? 'red' : '#0369a1'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleComment(item.id)} style={styles.iconSpacing}>
            <Feather name="message-circle" size={20} color="#0369a1" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleShare(item)} style={styles.iconSpacing}>
            <Feather name="share-2" size={20} color="#0369a1" />
          </TouchableOpacity>
        </View>
        <View style={styles.locationRow}>
          <Feather name="navigation" size={16} color="#555" />
          <Text style={styles.locationText}>{item.location}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Entypo name="menu" size={24} color="white" />
        <Text style={styles.logo}>BWstory</Text>
        <Feather name="search" size={22} color="white" />
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        {renderCategoryItem()}

        {loading ? (
          <ActivityIndicator size="large" color="#073b4c" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={feed}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 10 }}
            renderItem={renderFeedItem}
            onEndReached={loadMorePosts}
            onEndReachedThreshold={0.5}
            refreshing={refreshing}
            onRefresh={loadInitialPosts}
          />
        )}
      </SafeAreaView>
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

  categoryScroll: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  categoryButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  categoryActive: {
    backgroundColor: '#073b4c',
    borderColor: '#073b4c',
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
  },
  categoryTextActive: {
    color: 'white',
    fontWeight: '600',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  username: { marginLeft: 8, color: '#0369a1', fontWeight: '600' },
  postImage: {
    width: '100%',
    height: width * 0.6,
    resizeMode: 'cover',
  },
  postDetails: { padding: 10 },
  metaText: { fontSize: 12, color: '#888' },
  postTitle: { fontSize: 16, fontWeight: 'bold', marginVertical: 4 },
  iconRow: { flexDirection: 'row', marginVertical: 6 },
  iconSpacing: { marginLeft: 16 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  locationText: { marginLeft: 6, fontSize: 12, color: '#555' },
});
