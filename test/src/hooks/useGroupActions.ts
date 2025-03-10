import { useCallback } from 'react';
import { useGroupStore, Group } from '@/store/group-store';

export const useGroupActions = () => {
  const {
    groups,
    addGroup,
    createGroup,
    updateGroup,
    removeGroup,
    findGroupsBySegmentId,
    addSegmentToGroup,
    removeSegmentFromGroup
  } = useGroupStore();

  // 새 그룹 생성
  const createNewGroup = useCallback((name: string, segmentIds: string[]) => {
    if (!name.trim() || segmentIds.length === 0) return null;
    
    return createGroup(name, segmentIds);
  }, [createGroup]);

  // 그룹에 세그먼트 추가
  const addSegmentsToGroup = useCallback((groupId: string, segmentIds: string[]) => {
    segmentIds.forEach(segmentId => {
      addSegmentToGroup(groupId, segmentId);
    });
  }, [addSegmentToGroup]);

  // 그룹에서 세그먼트 제거
  const removeSegmentsFromGroup = useCallback((groupId: string, segmentIds: string[]) => {
    segmentIds.forEach(segmentId => {
      removeSegmentFromGroup(groupId, segmentId);
    });
  }, [removeSegmentFromGroup]);

  // 세그먼트가 속한 그룹 찾기
  const getSegmentGroups = useCallback((segmentId: string): Group[] => {
    return findGroupsBySegmentId(segmentId);
  }, [findGroupsBySegmentId]);

  // 그룹 색상 변경
  const updateGroupColor = useCallback((groupId: string, color: string) => {
    updateGroup(groupId, { color });
  }, [updateGroup]);

  // 그룹 이름 변경
  const updateGroupName = useCallback((groupId: string, name: string) => {
    if (!name.trim()) return;
    updateGroup(groupId, { name });
  }, [updateGroup]);

  // 그룹 삭제
  const deleteGroup = useCallback((groupId: string) => {
    removeGroup(groupId);
  }, [removeGroup]);

  // 그룹 목록 가져오기
  const getAllGroups = useCallback((): Group[] => {
    return Object.values(groups);
  }, [groups]);

  return {
    createNewGroup,
    addSegmentsToGroup,
    removeSegmentsFromGroup,
    getSegmentGroups,
    updateGroupColor,
    updateGroupName,
    deleteGroup,
    getAllGroups,
  };
};