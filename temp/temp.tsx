
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* CLICKABLE AVATAR SECTION */}
          <Pressable 
            style={styles.avatarContainer} 
            onPress={() => router.push('/profile')} // Navigate to profile page
          >
            {/* <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBwA8mbDnpc4KGlAtsEnWM9zeee9JKlQ1ylxt1kPXqscY8dWoaP0qHZgkyGvSmYk87fyHvLtzzrrtDitM-sJnKTRF_ClRnEiSxZxybQfvw2g5pSlBd7AIGApG2e-BKZ7DaxLSGCCFQsaz-xVEKQJmuPZxt-jfOSQeQtG38JEvDY4RjyPkppiCzuFcnuBJAzde7btSw7Zv5onQnDRYGxxq0b8w8lr9Rt6JWfY97wsHfLfMiPzXU64EyZzO2Q4nvRsSDcfpdog7jiZ-M' }}
              style={styles.avatar}
            /> */}
            <View style={styles.onlineBadge} />
          </Pressable>
          <View>
            <Text style={styles.greetingText}>{getGreeting()}</Text>
            <Text style={styles.userName}>Namaste, {userName ?? 'User'} 👋</Text>
          </View>
        </View>
        <Pressable 
          style={styles.iconButton}
          onPress={() => router.push('/notifications')}
        >
          <MaterialIcons name="notifications" size={24} color={COLORS.textMain} />
        </Pressable>
      </View>