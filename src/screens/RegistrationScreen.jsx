import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Feather';
import RNPickerSelect from 'react-native-picker-select';

// ... (states, districts, cities, and levelOptions arrays remain the same) ...
const states = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

const districts = {
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Tiruchirappalli'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad'],
  'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum']
};

const cities = {
  'Chennai': ['Anna Nagar', 'T. Nagar', 'Adyar', 'Velachery', 'Tambaram'],
  'Mumbai': ['Andheri', 'Bandra', 'Borivali', 'Powai', 'Thane'],
  'Bangalore': ['Koramangala', 'Indiranagar', 'Whitefield', 'Electronic City', 'HSR Layout']
};

const levelOptions = ['District', 'State', 'National', 'International'];

const steps = [
  { title: 'Basic Info', icon: 'user' },
  { title: 'Location', icon: 'map-pin' },
  { title: 'Sports Profile', icon: 'award' },
  { title: 'Medical Info', icon: 'heart' },
  { title: 'Verification', icon: 'shield' }
];

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    gender: '',
    mobile: '',
    email: '',
    state: '',
    district: '',
    city: '',
    levelPlayed: '',
    representedTeam: '',
    height: '',
    weight: '',
    profilePicture: null
  });

  const [currentStep, setCurrentStep] = useState(0);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo' });
    if (result.didCancel) {
      console.log('User cancelled image picker');
    } else if (result.error) {
      console.log('ImagePicker Error: ', result.error);
    } else {
      const source = { uri: result.assets[0].uri };
      setFormData(prev => ({ ...prev, profilePicture: source }));
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleFinalSubmit = async () => {
    const backendUrl = 'http://10.0.2.2:5000/api/profile/create-profile'; 

    try {
      const dataToSubmit = {
        ...formData,
        profilePicture: formData.profilePicture ? formData.profilePicture.uri : null,
      };

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit),
      });

      const result = await response.json();

      if (response.ok) { 
        Alert.alert('Success', 'Profile created and submitted successfully!');
        setFormData({
            name: '',
            dateOfBirth: '',
            gender: '',
            mobile: '',
            email: '',
            state: '',
            district: '',
            city: '',
            levelPlayed: '',
            representedTeam: '',
            height: '',
            weight: '',
            profilePicture: null
        });
        setCurrentStep(0);
      } else {
        Alert.alert('Error', result.msg || 'Failed to submit profile.');
      }
    } catch (error) {
      console.error('Submission error:', error);
      Alert.alert('Error', 'An error occurred. Please try again.');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <TouchableOpacity onPress={handleImageUpload} style={styles.imageUploadContainer}>
              {formData.profilePicture ? (
                <Image source={formData.profilePicture} style={styles.profileImage} />
              ) : (
                <Icon name="camera" size={48} color="#9ca3af" />
              )}
            </TouchableOpacity>
            <Text style={styles.uploadText}>Click to upload profile picture</Text>

            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <Icon name="user" size={20} color="#9ca3af" style={styles.icon} />
                <TextInput
                  placeholder="Full Name"
                  placeholderTextColor="#9ca3af"
                  value={formData.name}
                  onChangeText={(text) => handleInputChange('name', text)}
                  style={styles.input}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Icon name="calendar" size={20} color="#9ca3af" style={styles.icon} />
                <TextInput
                  placeholder="Date of Birth (YYYY-MM-DD)"
                  placeholderTextColor="#9ca3af"
                  value={formData.dateOfBirth}
                  onChangeText={(text) => handleInputChange('dateOfBirth', text)}
                  style={styles.input}
                />
              </View>

              <View style={styles.genderContainer}>
                <Text style={styles.genderLabel}>Gender</Text>
                <View style={styles.genderOptions}>
                  <TouchableOpacity
                    onPress={() => handleInputChange('gender', 'male')}
                    style={styles.radioOption}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        formData.gender === 'male' && styles.radioSelected,
                      ]}
                    />
                    <Text style={styles.radioText}>Male</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleInputChange('gender', 'female')}
                    style={styles.radioOption}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        formData.gender === 'female' && styles.radioSelected,
                      ]}
                    />
                    <Text style={styles.radioText}>Female</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TextInput
                placeholder="Mobile Number"
                placeholderTextColor="#9ca3af"
                value={formData.mobile}
                onChangeText={(text) => handleInputChange('mobile', text)}
                style={styles.input}
                keyboardType="phone-pad"
                underlineColorAndroid="transparent" 
              />
              <TextInput
                placeholder="Email Address"
                placeholderTextColor="#9ca3af"
                value={formData.email}
                onChangeText={(text) => handleInputChange('email', text)}
                style={styles.input}
                keyboardType="email-address"
                underlineColorAndroid="transparent" 
              />
            </View>
          </View>
        );

      case 1:
        const availableDistricts = districts[formData.state]?.map(d => ({ label: d, value: d })) || [];
        const availableCities = cities[formData.district]?.map(c => ({ label: c, value: c })) || [];

        return (
          <View style={styles.stepContainer}>
            <View style={styles.header}>
              <Icon name="map-pin" size={64} color="#4caF50" />
              <Text style={styles.title}>Location Details</Text>
              <Text style={styles.subtitle}>Help us locate you on the map</Text>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.pickerContainer}>
                <RNPickerSelect
                  placeholder={{ label: 'Select State', value: null }}
                  items={states.map(state => ({ label: state, value: state }))}
                  onValueChange={(value) => handleInputChange('state', value)}
                  value={formData.state}
                  style={pickerSelectStyles}
                />
              </View>
              <View style={styles.pickerContainer}>
                <RNPickerSelect
                  placeholder={{ label: 'Select District', value: null }}
                  items={availableDistricts}
                  onValueChange={(value) => handleInputChange('district', value)}
                  value={formData.district}
                  style={pickerSelectStyles}
                  disabled={!formData.state}
                />
              </View>
              <View style={styles.pickerContainer}>
                <RNPickerSelect
                  placeholder={{ label: 'Select City', value: null }}
                  items={availableCities}
                  onValueChange={(value) => handleInputChange('city', value)}
                  value={formData.city}
                  style={pickerSelectStyles}
                  disabled={!formData.district}
                />
              </View>
            </View>

            <View style={[styles.infoBox, styles.blueBox]}>
              <View style={styles.infoRow}>
                <Icon name="map-pin" size={24} color="#4caF50" />
                <Text style={styles.infoTitle}>Map Pin Location</Text>
              </View>
              <Text style={styles.infoText}>Your location will be pinned on the map</Text>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.header}>
              <Icon name="award" size={64} color="#f59e0b" />
              <Text style={styles.title}>Sports Profile</Text>
              <Text style={styles.subtitle}>Tell us about your sports achievements</Text>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.pickerContainer}>
                <RNPickerSelect
                  placeholder={{ label: 'Select Level Played', value: null }}
                  items={levelOptions.map(level => ({ label: level, value: level }))}
                  onValueChange={(value) => handleInputChange('levelPlayed', value)}
                  value={formData.levelPlayed}
                  style={pickerSelectStyles}
                />
              </View>
              <View style={styles.inputWrapper}>
                <Icon name="award" size={20} color="#9ca3af" style={styles.icon} />
                <TextInput
                  placeholder="Represented State/District/Team"
                  placeholderTextColor="#9ca3af"
                  value={formData.representedTeam}
                  onChangeText={(text) => handleInputChange('representedTeam', text)}
                  style={styles.input}
                  underlineColorAndroid="transparent" 
                />
              </View>
            </View>

            <View style={[styles.infoBox, styles.yellowBox]}>
              <View style={styles.infoRow}>
                <Icon name="award" size={24} color="#f59e0b" />
                <Text style={styles.infoTitle}>Sports Achievements</Text>
              </View>
              <Text style={styles.infoText}>Your sports profile will be displayed on your badge</Text>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.header}>
              <Icon name="heart" size={64} color="#ef4444" />
              <Text style={styles.title}>Medical Information</Text>
              <Text style={styles.subtitle}>Health details for safety purposes</Text>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.row}>
                <TextInput
                  placeholder="Height (cm)"
                  placeholderTextColor="#9ca3af"
                  value={formData.height}
                  onChangeText={(text) => handleInputChange('height', text)}
                  style={styles.halfInput}
                  keyboardType="numeric"
                  underlineColorAndroid="transparent" 
                />
                <TextInput
                  placeholder="Weight (kg)"
                  placeholderTextColor="#9ca3af"
                  value={formData.weight}
                  onChangeText={(text) => handleInputChange('weight', text)}
                  style={styles.halfInput}
                  keyboardType="numeric"
                  underlineColorAndroid="transparent" 
                />
              </View>
            </View>

            <View style={[styles.infoBox, styles.redBox]}>
              <View style={styles.infoRow}>
                <Icon name="heart" size={24} color="#ef4444" />
                <Text style={styles.infoTitle}>Health & Safety</Text>
              </View>
              <Text style={styles.infoText}>This information helps in emergency situations</Text>
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <View style={styles.header}>
              <Icon name="shield" size={64} color="#22c55e" />
              <Text style={styles.title}>User Verification</Text>
              <Text style={styles.subtitle}>Complete your profile verification</Text>
            </View>

            <View style={styles.verificationCard}>
              <View style={styles.profileSummary}>
                <View style={styles.profileImageWrapper}>
                  {formData.profilePicture ? (
                    <Image source={formData.profilePicture} style={styles.profileImageSmall} />
                  ) : (
                    <Icon name="user" size={48} color="#9ca3af" />
                  )}
                </View>
                <Text style={styles.summaryName}>{formData.name || 'Your Name'}</Text>
                <View style={styles.summaryDetails}>
                  <Text style={styles.summaryText}>{formData.email || 'email@example.com'}</Text>
                  <Text style={styles.summaryText}>{formData.mobile || '+91 XXXXX XXXXX'}</Text>
                  <Text style={styles.summaryText}>
                    {[formData.city, formData.district, formData.state].filter(Boolean).join(', ') || 'Location'}
                  </Text>
                  <Text style={styles.summaryLevel}>{formData.levelPlayed || 'Level'} Player</Text>
                </View>
              </View>
            </View>

            <View style={[styles.infoBox, styles.greenBox]}>
              <View style={styles.infoRow}>
                <Icon name="shield" size={24} color="#22c55e" />
                <Text style={styles.infoTitle}>Verification Pending</Text>
              </View>
              <Text style={styles.infoText}>Your badge will be generated after verification</Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const finishRegistration = () => {
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <View style={styles.trophyIconContainer}>
            <Icon name="award" size={32} color="white" />
          </View>
          <Text style={styles.mainTitle}>Registration</Text>
          <Text style={styles.subTitle}>Create your profile</Text>
        </View>

        <View style={styles.progressContainer}>
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            return (
              <View key={index} style={styles.progressStep}>
                <View
                  style={[
                    styles.progressIcon,
                    isActive && styles.progressIconActive,
                    isCompleted && styles.progressIconCompleted,
                  ]}
                >
                  <Icon
                    name={step.icon}
                    size={20}
                    color={isActive || isCompleted ? 'white' : '#9ca3af'}
                  />
                </View>
                <Text
                  style={[
                    styles.progressText,
                    isActive && styles.progressTextActive,
                  ]}
                >
                  {step.title}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.contentBox}>{renderStepContent()}</View>

        <View style={styles.buttonContainer}>
          {currentStep > 0 && (
            <TouchableOpacity onPress={prevStep} style={[styles.button, styles.prevButton]}>
              <Text style={styles.prevButtonText}>Previous</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={currentStep === steps.length - 1 ? finishRegistration : nextStep}
            style={[
              styles.button,
              styles.nextButton,
              currentStep === 0 && styles.fullWidthButton,
            ]}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
        padding: 16,
      },
      scrollContent: {
        flexGrow: 1,
        paddingBottom: 24,
      },
      headerContainer: {
        alignItems: 'center',
        marginBottom: 32,
      },
      trophyIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: '#4caF50',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        elevation: 5,
      },
      mainTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1f2937',
        marginBottom: 8,
      },
      subTitle: {
        fontSize: 16,
        color: '#4b5563',
      },
      progressContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
        paddingHorizontal: 8,
      },
      progressStep: {
        alignItems: 'center',
        flex: 1,
      },
      progressIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#d1d5db',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
      },
      progressIconActive: {
        backgroundColor: '#4caF50',
        borderColor: '#4caF50',
      },
      progressIconCompleted: {
        backgroundColor: '#22c55e',
        borderColor: '#22c55e',
      },
      progressText: {
        fontSize: 10,
        marginTop: 4,
        color: '#6b7280',
        textAlign: 'center',
      },
      progressTextActive: {
        color: '#4caF50',
        fontWeight: '600',
      },
      contentBox: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        elevation: 10,
        marginBottom: 24,
      },
      stepContainer: {
        flex: 1,
      },
      imageUploadContainer: {
        width: 128,
        height: 128,
        borderRadius: 64,
        backgroundColor: '#e0e7ff',
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'white',
        elevation: 5,
        marginBottom: 8,
        overflow: 'hidden',
      },
      profileImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
      },
      uploadText: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 32,
      },
      inputGroup: {
        gap: 24,
      },
      inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
      },
      icon: {
        position: 'absolute',
        left: 12,
      },
      input: {
        flex: 1,
        paddingLeft: 40,
        paddingRight: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        color: '#1f2937',
        fontSize: 16,
      },
      genderContainer: {
        gap: 16,
      },
      genderLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
      },
      genderOptions: {
        flexDirection: 'row',
        gap: 24,
      },
      radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      radioCircle: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
      },
      radioSelected: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
      },
      radioText: {
        marginLeft: 8,
        color: '#374151',
      },
      header: {
        alignItems: 'center',
        marginBottom: 24,
      },
      title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1f2937',
        marginTop: 16,
        marginBottom: 4,
      },
      subtitle: {
        color: '#4b5563',
      },
      pickerContainer: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        paddingHorizontal: 8,
      },
      infoBox: {
        borderRadius: 16,
        borderWidth: 2,
        borderStyle: 'dashed',
        padding: 16,
        marginTop: 24,
      },
      blueBox: {
        backgroundColor: '#eff6ff',
        borderColor: '#bfdbfe',
      },
      yellowBox: {
        backgroundColor: '#fefce8',
        borderColor: '#fde68a',
      },
      redBox: {
        backgroundColor: '#fef2f2',
        borderColor: '#fecaca',
      },
      greenBox: {
        backgroundColor: '#f0fdf4',
        borderColor: '#dcfce7',
      },
      infoRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
      },
      infoTitle: {
        color: '#1c1c1c',
        fontWeight: '600',
        fontSize: 16,
        marginLeft: 8,
      },
      infoText: {
        color: '#4b5563',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 4,
      },
      row: {
        flexDirection: 'row',
        gap: 16,
      },
      halfInput: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 12,
        color: '#1f2937',
        fontSize: 16,
      },
      verificationCard: {
        backgroundColor: '#eef2ff',
        borderRadius: 16,
        padding: 24,
        borderWidth: 2,
        borderColor: '#bfdbfe',
        marginBottom: 24,
      },
      profileSummary: {
        alignItems: 'center',
      },
      profileImageWrapper: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        marginBottom: 16,
        overflow: 'hidden',
      },
      profileImageSmall: {
        width: 80,
        height: 80,
        borderRadius: 40,
        resizeMode: 'cover',
      },
      summaryName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 8,
      },
      summaryDetails: {
        alignItems: 'center',
        gap: 4,
      },
      summaryText: {
        fontSize: 14,
        color: '#4b5563',
      },
      summaryLevel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#4caF50',
      },
      buttonContainer: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 'auto',
      },
      button: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
      },
      prevButton: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#d1d5db',
      },
      prevButtonText: {
        color: '#374151',
        fontWeight: '500',
      },
      nextButton: {
        backgroundColor: '#4caF50',
        elevation: 5,
      },
      nextButtonText: {
        color: 'white',
        fontWeight: '500',
      },
      fullWidthButton: {
        flex: 1,
      },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: '#1f2937',
    fontSize: 16,
  },
  inputAndroid: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#1f2937',
    fontSize: 16,
  },
  placeholder: {
    color: '#9ca3af',
  },
});