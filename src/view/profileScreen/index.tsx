import React, { useState } from 'react';
import { Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { IProfile } from '../../@types/storage';
import { useProfiles } from '../../hooks/useProfiles';
import { useAuth } from '../../hooks/useAuth';
import { useCast } from '../../hooks/useCast';
import { clearXtreamCache } from '../../hooks/useXtream';
import { useAppInsets } from '../../hooks/useAppInsets';
import { DEFAULT_PROFILE_ID, storageService } from '../../services/storageService';
import { PROFILE_COLORS, MAX_PROFILES, PROFILE_NAME_MAX_LENGTH } from '../../services/profileService';
import { InputGlobal } from '../../components/inputGlobal';
import { ButtonGlobal } from '../../components/buttonGlobal';
import { ConfirmModalGlobal } from '../../components/confirmModalGlobal';
import { KeyboardAvoidingGlobal } from '../../components/keyboardAvoidingGlobal';
import {
  Screen,
  Container,
  GearButton,
  Title,
  Subtitle,
  ProfileList,
  ProfileRow,
  Avatar,
  AddAvatar,
  ProfileName,
  AddLabel,
  ListFooter,
  ListInfoText,
  SwitchListButtonWrapper,
  ModalBackdrop,
  ModalCard,
  ModalHeader,
  ModalTitle,
  ColorRow,
  ColorSwatch,
  ModalActions,
} from './style';

type EditorState = { mode: 'create' } | { mode: 'edit'; profile: IProfile } | null;

export const ProfileScreen: React.FC = () => {
  const insets = useAppInsets();
  const { profiles, selectProfile, createProfile, updateProfile, deleteProfile } = useProfiles();
  const { account, logout } = useAuth();
  const { isCasting, stopCast } = useCast();
  const [isSwitchListConfirmVisible, setIsSwitchListConfirmVisible] = useState(false);
  const [isManaging, setIsManaging] = useState(false);
  const [editor, setEditor] = useState<EditorState>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PROFILE_COLORS[0]);
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);

  const canAddProfile = profiles.length < MAX_PROFILES;

  const openCreate = () => {
    setName('');
    setColor(PROFILE_COLORS[profiles.length % PROFILE_COLORS.length]);
    setEditor({ mode: 'create' });
  };

  const openEdit = (profile: IProfile) => {
    setName(profile.name);
    setColor(profile.color || PROFILE_COLORS[0]);
    setEditor({ mode: 'edit', profile });
  };

  const handleProfilePress = (profile: IProfile) => {
    if (isManaging) {
      openEdit(profile);
    } else {
      selectProfile(profile.id);
    }
  };

  const handleSave = () => {
    if (!editor || !name.trim()) return;
    if (editor.mode === 'create') {
      createProfile(name, color);
    } else {
      updateProfile(editor.profile.id, { name, color });
    }
    setEditor(null);
  };

  const handleConfirmDelete = () => {
    if (editor?.mode === 'edit') {
      deleteProfile(editor.profile.id);
    }
    setIsDeleteConfirmVisible(false);
    setEditor(null);
  };

  // Volta para a tela de conexão; perfis e histórico desta lista continuam salvos no aparelho
  const handleSwitchList = () => {
    setIsSwitchListConfirmVisible(false);
    if (isCasting) {
      stopCast();
    }
    clearXtreamCache();
    storageService.clearCatalogCache();
    logout();
  };

  const editingProfile = editor?.mode === 'edit' ? editor.profile : null;

  return (
    <Screen testID="profile-screen">
      <GearButton
        insetTop={insets.top}
        onPress={() => setIsManaging((prev) => !prev)}
        accessibilityRole="button"
        accessibilityLabel={isManaging ? 'Concluir gerenciamento de perfis' : 'Gerenciar perfis'}
        testID="profile-manage-toggle"
      >
        <MaterialIcons name={isManaging ? 'check' : 'settings'} size={24} color="#FFFFFF" />
      </GearButton>

      <Container>
        <Title>{isManaging ? 'Gerenciar perfis' : 'Quem está assistindo?'}</Title>
        {isManaging && <Subtitle>Toque em um perfil para editar</Subtitle>}

        <ProfileList>
          {profiles.map((profile, index) => (
            <ProfileRow
              key={profile.id}
              onPress={() => handleProfilePress(profile)}
              hasTVPreferredFocus={index === 0}
              accessibilityRole="button"
              accessibilityLabel={
                isManaging ? `Editar perfil ${profile.name}` : `Entrar como ${profile.name}`
              }
              testID={`profile-tile-${profile.id}`}
            >
              <Avatar color={profile.color || PROFILE_COLORS[0]}>
                <MaterialIcons name="person" size={30} color="#FFFFFF" />
              </Avatar>
              <ProfileName>{profile.name}</ProfileName>
              <MaterialIcons
                name={isManaging ? 'edit' : 'chevron-right'}
                size={22}
                color="#AAAAAA"
              />
            </ProfileRow>
          ))}

          {isManaging && canAddProfile && (
            <ProfileRow
              onPress={openCreate}
              accessibilityRole="button"
              accessibilityLabel="Adicionar perfil"
              testID="profile-add"
            >
              <AddAvatar>
                <MaterialIcons name="add" size={24} color="#AAAAAA" />
              </AddAvatar>
              <AddLabel>Adicionar perfil</AddLabel>
            </ProfileRow>
          )}
        </ProfileList>

        <ListFooter>
          {account && (
            <ListInfoText>
              {account.label || 'Lista conectada'} • @{account.username}
            </ListInfoText>
          )}
          <SwitchListButtonWrapper>
            <ButtonGlobal
              label="Trocar lista"
              variant="ghost"
              size="sm"
              icon={<MaterialIcons name="swap-horiz" size={18} color="#FFFFFF" />}
              onPress={() => setIsSwitchListConfirmVisible(true)}
              testID="profile-switch-list"
            />
          </SwitchListButtonWrapper>
        </ListFooter>
      </Container>

      <Modal
        visible={Boolean(editor) && !isDeleteConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditor(null)}
      >
        <KeyboardAvoidingGlobal>
          <ModalBackdrop>
            <ModalCard keyboardShouldPersistTaps="handled">
              <ModalHeader>
                <Avatar color={color} size={52}>
                  <MaterialIcons name="person" size={36} color="#FFFFFF" />
                </Avatar>
                <ModalTitle>{editingProfile ? 'Editar perfil' : 'Novo perfil'}</ModalTitle>
              </ModalHeader>

              <InputGlobal
                label="Nome"
                value={name}
                onChangeText={setName}
                maxLength={PROFILE_NAME_MAX_LENGTH}
                placeholder="Ex.: Maria"
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSave}
                testID="profile-name-input"
              />

              <ColorRow>
                {PROFILE_COLORS.map((swatch) => (
                  <ColorSwatch
                    key={swatch}
                    color={swatch}
                    isSelected={swatch === color}
                    onPress={() => setColor(swatch)}
                    accessibilityRole="button"
                    accessibilityLabel={`Cor ${swatch}`}
                    testID={`profile-color-${swatch}`}
                  />
                ))}
              </ColorRow>

              <ModalActions>
                <ButtonGlobal
                  label="Salvar"
                  onPress={handleSave}
                  disabled={!name.trim()}
                  testID="profile-save"
                />
                {editingProfile && editingProfile.id !== DEFAULT_PROFILE_ID && (
                  <ButtonGlobal
                    label="Excluir perfil"
                    variant="danger"
                    onPress={() => setIsDeleteConfirmVisible(true)}
                    testID="profile-delete"
                  />
                )}
                <ButtonGlobal label="Cancelar" variant="ghost" onPress={() => setEditor(null)} />
              </ModalActions>
            </ModalCard>
          </ModalBackdrop>
        </KeyboardAvoidingGlobal>
      </Modal>

      <ConfirmModalGlobal
        visible={isDeleteConfirmVisible}
        title="Excluir perfil"
        description={`O histórico e os favoritos de "${editingProfile?.name ?? ''}" serão apagados. Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        iconName="delete-outline"
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleteConfirmVisible(false)}
        testID="profile-delete-confirm"
      />

      <ConfirmModalGlobal
        visible={isSwitchListConfirmVisible}
        title="Trocar de lista"
        description="Você vai voltar para a tela de conexão. Os perfis e o histórico desta lista continuam salvos neste aparelho."
        confirmText="Trocar"
        cancelText="Cancelar"
        variant="warning"
        iconName="swap-horiz"
        onConfirm={handleSwitchList}
        onCancel={() => setIsSwitchListConfirmVisible(false)}
        testID="profile-switch-list-confirm"
      />
    </Screen>
  );
};
