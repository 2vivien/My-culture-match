import React from 'react';
import { View, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import tw from '@/lib/tailwind';
import { MeshBackground } from '../components/Onboarding/MeshBackground';
import { useOnboarding } from '../hooks/useOnboarding';
import { StepNavigation } from '../components/Onboarding/StepNavigation';

// Step Components
import { IntentionStep } from '../components/Onboarding/Steps/IntentionStep';
import { GenderStep } from '../components/Onboarding/Steps/GenderStep';
import { IdentityStep } from '../components/Onboarding/Steps/IdentityStep';
import { RootsStep } from '../components/Onboarding/Steps/RootsStep';
import { AgeStep } from '../components/Onboarding/Steps/AgeStep';
import { OccupationStep } from '../components/Onboarding/Steps/OccupationStep';
import { ValuesStep } from '../components/Onboarding/Steps/ValuesStep';
import { LanguagesStep } from '../components/Onboarding/Steps/LanguagesStep';
import { PreferenceStep } from '../components/Onboarding/Steps/PreferenceStep';
import { DiasporaStep } from '../components/Onboarding/Steps/DiasporaStep';
import { FamilyStep } from '../components/Onboarding/Steps/FamilyStep';
import { SituationStep } from '../components/Onboarding/Steps/SituationStep';
import { CriteriaStep } from '../components/Onboarding/Steps/CriteriaStep';
import { BioStep } from '../components/Onboarding/Steps/BioStep';
import { RecapStep } from '../components/Onboarding/Steps/RecapStep';

export const InterestsScreen = ({ onFinish }: { onFinish?: () => void }) => {
  const { step, formData, next, back, updateField, toggleList } = useOnboarding();

  const renderProgress = () => (
    <View style={tw`px-8 pt-6 pb-4`}>
      <View style={tw`h-[6px] bg-gray-100 rounded-full overflow-hidden`}>
        <View style={[tw`h-full bg-primary rounded-full`, { width: `${(step / 15) * 100}%` }]} />
      </View>
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 1: return <IntentionStep value={formData.intention} onChange={v => updateField('intention', v)} />;
      case 2: return <GenderStep gender={formData.gender} seeking={formData.seeking} onGenderChange={v => updateField('gender', v)} onSeekingChange={v => updateField('seeking', v)} />;
      case 3: return <IdentityStep name={formData.name} onNameChange={v => updateField('name', v)} photo={formData.photo} />;
      case 4: return <RootsStep roots={formData.roots} onChange={v => updateField('roots', v)} />;
      case 5: return <AgeStep age={formData.age} seekAge={formData.seekAge} onChange={v => updateField('age', v)} onSeekAgeChange={v => updateField('seekAge', v)} />;
      case 6: return <OccupationStep value={formData.occupation} onChange={v => updateField('occupation', v)} />;
      case 7: return <ValuesStep selected={formData.values} onToggle={v => toggleList('values', v, 4)} />;
      case 8: return <LanguagesStep selected={formData.languages} onToggle={v => toggleList('languages', v)} />;
      case 9: return <PreferenceStep value={formData.preference} onChange={v => updateField('preference', v)} />;
      case 10: return <DiasporaStep value={formData.diaspora} onChange={v => updateField('diaspora', v)} />;
      case 11: return <FamilyStep value={formData.familyQuiz} onChange={v => updateField('familyQuiz', v)} />;
      case 12: return <SituationStep value={formData.situation} onChange={v => updateField('situation', v)} />;
      case 13: return <CriteriaStep selected={formData.criteria} onToggle={v => toggleList('criteria', v, 5)} />;
      case 14: return <BioStep value={formData.bio} onChange={v => updateField('bio', v)} />;
      case 15: return <RecapStep data={formData} />;
      default: return null;
    }
  };

  return (
    <View style={tw`flex-1 bg-white`}>
      <StatusBar barStyle="dark-content" />
      <MeshBackground variant={step % 3 === 0 ? 1 : 2} />
      <SafeAreaView style={tw`flex-1`}>
        {renderProgress()}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={tw`px-8 pt-4 pb-32`}>
          {renderStep()}
        </ScrollView>
        <StepNavigation step={step} onBack={back} onNext={() => step === 15 ? onFinish?.() : next()} isLast={step === 15} />
      </SafeAreaView>
    </View>
  );
};
