import React, { useState, useEffect } from 'react';
import { traditionService } from '@/src/services/traditionService';
import { uploadService } from '@/src/services/uploadService';
import { mediaUrl } from '@/src/lib/media';
import { USE_MOCK } from '@/src/services/api';
import type { TribeOption, TraditionSubmission } from '@/src/types/createTradition';
import { useUIStore } from '@/src/stores/useUIStore';

export function useCreateTradition() {
  const { setActiveTab } = useUIStore();
  
  const [tribes, setTribes] = useState<TribeOption[]>([]);
  const [selectedTribe, setSelectedTribe] = useState<TribeOption | null>(null);
  const [tribuDropdownOpen, setTribuDropdownOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'Text' | 'Images' | 'Link'>('Text');
  
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const [formats, setFormats] = useState<Record<string, boolean>>({
    bold: false,
    italic: false,
    strikethrough: false,
    superscript: false,
    list: false,
    orderedList: false,
    quote: false,
    code: false,
  });

  useEffect(() => {
    let isMounted = true;
    traditionService.getTribes().then((data) => {
      if (isMounted) {
        setTribes(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleFormat = (format: string) => {
    setFormats((prev) => ({ ...prev, [format]: !prev[format] }));
  };

  const selectTribe = (tribe: TribeOption) => {
    setSelectedTribe(tribe);
    setTribuDropdownOpen(false);
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
  };

  const handleSubmit = async () => {
    if (activeSubTab === 'Text' && !title.trim()) return;
    if (activeSubTab === 'Images' && !mediaPreview) return;
    if (activeSubTab === 'Link' && !linkUrl.trim()) return;

    setIsSubmitting(true);

    let resolvedMediaUrl = mediaPreview ?? undefined;
    if (activeSubTab === 'Images' && mediaFile && !USE_MOCK) {
      const uploaded = await uploadService.uploadFile(mediaFile, 'post');
      if (uploaded?.objectKey) {
        resolvedMediaUrl = mediaUrl(uploaded.objectKey);
      }
    }

    const submission: TraditionSubmission = {
      title,
      body: activeSubTab === 'Text' ? body : undefined,
      mediaUrl: activeSubTab === 'Images' ? resolvedMediaUrl : undefined,
      linkUrl: activeSubTab === 'Link' ? linkUrl : undefined,
      tribeId: selectedTribe?.id,
      type: activeSubTab,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    };

    try {
      await traditionService.submitTradition(submission);
      setActiveTab('Home');
    } catch (err) {
      console.error('Error submitting tradition:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    tribes,
    selectedTribe,
    tribuDropdownOpen,
    setTribuDropdownOpen,
    activeSubTab,
    setActiveSubTab,
    title,
    setTitle,
    body,
    setBody,
    linkUrl,
    setLinkUrl,
    mediaPreview,
    handleMediaChange,
    clearMedia,
    formats,
    toggleFormat,
    isSubmitting,
    selectTribe,
    handleSubmit,
    selectedTags,
    toggleTag,
  };
}
