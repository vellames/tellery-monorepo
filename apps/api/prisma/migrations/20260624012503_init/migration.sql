-- CreateEnum
CREATE TYPE "HistoryStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "ClueImportance" AS ENUM ('required', 'supporting', 'red_herring');

-- CreateEnum
CREATE TYPE "ConclusionFieldType" AS ENUM ('character', 'choice');

-- CreateEnum
CREATE TYPE "EndingType" AS ENUM ('full_truth', 'partial_truth', 'wrong_accusation');

-- CreateEnum
CREATE TYPE "SecretDefaultStrategy" AS ENUM ('deny', 'avoid', 'deflect', 'cover_story', 'justify');

-- CreateEnum
CREATE TYPE "HistorySessionStatus" AS ENUM ('active', 'completed', 'abandoned');

-- CreateEnum
CREATE TYPE "InteractionRole" AS ENUM ('user', 'character', 'object');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "History" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "teaser" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "estimatedDurationMinutes" INTEGER NOT NULL,
    "status" "HistoryStatus" NOT NULL DEFAULT 'draft',
    "coverImageUrl" TEXT,
    "thumbnailUrl" TEXT,
    "opening" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "History_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntentDefinition" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "historyId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "examples" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "IntentDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterDefinition" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "historyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "imageUrl" TEXT,
    "personality" TEXT NOT NULL,
    "speakingStyle" TEXT NOT NULL,
    "publicKnowledge" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "privateKnowledge" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "conversationBoundaries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "openingLine" TEXT NOT NULL,

    CONSTRAINT "CharacterDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterClueRevealRule" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "clueId" TEXT NOT NULL,
    "revealText" TEXT NOT NULL,
    "responseGuidance" TEXT NOT NULL,

    CONSTRAINT "CharacterClueRevealRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterSecret" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "characterId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "truth" TEXT NOT NULL,
    "defaultStrategy" "SecretDefaultStrategy" NOT NULL,

    CONSTRAINT "CharacterSecret_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecretRevealStage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "secretId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "behavior" TEXT NOT NULL,
    "allowedToRevealTruth" BOOLEAN NOT NULL,
    "sampleResponses" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "SecretRevealStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationDefinition" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "historyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "imageUrl" TEXT,
    "initialDescription" TEXT NOT NULL,

    CONSTRAINT "LocationDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObjectDefinition" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "historyId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "imageUrl" TEXT,
    "initialDescription" TEXT NOT NULL,

    CONSTRAINT "ObjectDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObjectClueRevealRule" (
    "id" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "clueId" TEXT NOT NULL,
    "revealText" TEXT NOT NULL,

    CONSTRAINT "ObjectClueRevealRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClueDefinition" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "historyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "importance" "ClueImportance" NOT NULL,

    CONSTRAINT "ClueDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConclusionDefinition" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "historyId" TEXT NOT NULL,

    CONSTRAINT "ConclusionDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConclusionField" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "conclusionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "ConclusionFieldType" NOT NULL,

    CONSTRAINT "ConclusionField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConclusionOption" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "fieldId" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "ConclusionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EndingDefinition" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "historyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "EndingType" NOT NULL,
    "conclusionMatches" JSONB NOT NULL,
    "summary" TEXT NOT NULL,
    "epilogue" TEXT NOT NULL,

    CONSTRAINT "EndingDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorySession" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "historyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "teaser" TEXT NOT NULL,
    "opening" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "thumbnailUrl" TEXT,
    "estimatedDurationMinutes" INTEGER NOT NULL,
    "status" "HistorySessionStatus" NOT NULL DEFAULT 'active',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "HistorySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionClue" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "sessionId" TEXT NOT NULL,
    "clueDefinitionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "importance" "ClueImportance" NOT NULL,
    "discovered" BOOLEAN NOT NULL DEFAULT false,
    "discoveredAt" TIMESTAMP(3),

    CONSTRAINT "SessionClue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionIntent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "sessionId" TEXT NOT NULL,
    "intentDefinitionId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "examples" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "SessionIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterSessionState" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "sessionId" TEXT NOT NULL,
    "characterDefinitionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "imageUrl" TEXT,
    "personality" TEXT NOT NULL,
    "speakingStyle" TEXT NOT NULL,
    "openingLine" TEXT NOT NULL,
    "publicKnowledge" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "privateKnowledge" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "conversationBoundaries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "conversationSummary" TEXT,

    CONSTRAINT "CharacterSessionState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionCharacterClueRevealRule" (
    "id" TEXT NOT NULL,
    "characterStateId" TEXT NOT NULL,
    "clueId" TEXT NOT NULL,
    "revealText" TEXT NOT NULL,
    "responseGuidance" TEXT NOT NULL,

    CONSTRAINT "SessionCharacterClueRevealRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterSecretSessionState" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "characterStateId" TEXT NOT NULL,
    "secretDefinitionId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "truth" TEXT NOT NULL,
    "defaultStrategy" "SecretDefaultStrategy" NOT NULL,
    "currentStageLevel" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CharacterSecretSessionState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionSecretRevealStage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "secretStateId" TEXT NOT NULL,
    "stageDefinitionId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "behavior" TEXT NOT NULL,
    "allowedToRevealTruth" BOOLEAN NOT NULL,
    "sampleResponses" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "SessionSecretRevealStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationSessionState" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "sessionId" TEXT NOT NULL,
    "locationDefinitionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "imageUrl" TEXT,
    "initialDescription" TEXT NOT NULL,
    "visited" BOOLEAN NOT NULL DEFAULT false,
    "visitedAt" TIMESTAMP(3),

    CONSTRAINT "LocationSessionState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObjectSessionState" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "sessionId" TEXT NOT NULL,
    "objectDefinitionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "imageUrl" TEXT,
    "initialDescription" TEXT NOT NULL,
    "inspected" BOOLEAN NOT NULL DEFAULT false,
    "inspectedAt" TIMESTAMP(3),

    CONSTRAINT "ObjectSessionState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionObjectClueRevealRule" (
    "id" TEXT NOT NULL,
    "objectStateId" TEXT NOT NULL,
    "clueId" TEXT NOT NULL,
    "revealText" TEXT NOT NULL,

    CONSTRAINT "SessionObjectClueRevealRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObjectInteractionMessage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "objectStateId" TEXT NOT NULL,
    "role" "InteractionRole" NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "ObjectInteractionMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterConversationMessage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "characterStateId" TEXT NOT NULL,
    "role" "InteractionRole" NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "CharacterConversationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionConclusionField" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "sessionId" TEXT NOT NULL,
    "fieldDefinitionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "ConclusionFieldType" NOT NULL,

    CONSTRAINT "SessionConclusionField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionConclusionOption" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "fieldId" TEXT NOT NULL,
    "optionDefinitionId" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "SessionConclusionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionConclusion" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "sessionId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionConclusion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionConclusionAnswer" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conclusionId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,

    CONSTRAINT "SessionConclusionAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionEndingSnapshot" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "sessionId" TEXT NOT NULL,
    "endingDefinitionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "EndingType" NOT NULL,
    "summary" TEXT NOT NULL,
    "epilogue" TEXT NOT NULL,
    "conclusionMatches" JSONB NOT NULL,

    CONSTRAINT "SessionEndingSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionEnding" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "sessionId" TEXT NOT NULL,
    "endingSnapshotId" TEXT NOT NULL,

    CONSTRAINT "SessionEnding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionScore" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionEndingId" TEXT NOT NULL,
    "discoveredClues" INTEGER NOT NULL,
    "totalClues" INTEGER NOT NULL,
    "requiredCluesDiscovered" INTEGER NOT NULL,
    "totalRequiredClues" INTEGER NOT NULL,
    "correctAnswers" INTEGER NOT NULL,
    "totalAnswers" INTEGER NOT NULL,

    CONSTRAINT "SessionScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ObjectRevealRuleTriggerIntents" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ObjectRevealRuleTriggerIntents_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SecretStageTriggerIntents" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SecretStageTriggerIntents_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CharacterRevealRuleTriggerIntents" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CharacterRevealRuleTriggerIntents_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CharacterRevealRuleRequiredClues" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CharacterRevealRuleRequiredClues_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ObjectRevealRuleRequiredClues" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ObjectRevealRuleRequiredClues_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SecretStageRequiredClues" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SecretStageRequiredClues_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SecretStageRevealedClues" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SecretStageRevealedClues_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_LocationAmbientClues" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_LocationAmbientClues_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_EndingRequiredClues" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EndingRequiredClues_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ObjRuleRequiredClues" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ObjRuleRequiredClues_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SessionSecretStageRequiredClues" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SessionSecretStageRequiredClues_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SessionSecretStageRevealedClues" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SessionSecretStageRevealedClues_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SessionEndingRequiredClues" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SessionEndingRequiredClues_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ObjRuleTriggerIntents" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ObjRuleTriggerIntents_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SessionSecretStageTriggerIntents" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SessionSecretStageTriggerIntents_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CharStateRevealedClues" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CharStateRevealedClues_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CharRuleTriggerIntents" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CharRuleTriggerIntents_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CharRuleRequiredClues" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CharRuleRequiredClues_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SecretStateRevealedClues" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SecretStateRevealedClues_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SessionLocationAmbientClues" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SessionLocationAmbientClues_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_LocationRevealedAmbientClues" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_LocationRevealedAmbientClues_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ObjStateRevealedClues" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ObjStateRevealedClues_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "History_slug_key" ON "History"("slug");

-- CreateIndex
CREATE INDEX "IntentDefinition_historyId_idx" ON "IntentDefinition"("historyId");

-- CreateIndex
CREATE INDEX "CharacterDefinition_historyId_idx" ON "CharacterDefinition"("historyId");

-- CreateIndex
CREATE INDEX "CharacterClueRevealRule_characterId_idx" ON "CharacterClueRevealRule"("characterId");

-- CreateIndex
CREATE INDEX "CharacterClueRevealRule_clueId_idx" ON "CharacterClueRevealRule"("clueId");

-- CreateIndex
CREATE INDEX "CharacterSecret_characterId_idx" ON "CharacterSecret"("characterId");

-- CreateIndex
CREATE INDEX "SecretRevealStage_secretId_idx" ON "SecretRevealStage"("secretId");

-- CreateIndex
CREATE INDEX "LocationDefinition_historyId_idx" ON "LocationDefinition"("historyId");

-- CreateIndex
CREATE INDEX "ObjectDefinition_historyId_idx" ON "ObjectDefinition"("historyId");

-- CreateIndex
CREATE INDEX "ObjectDefinition_locationId_idx" ON "ObjectDefinition"("locationId");

-- CreateIndex
CREATE INDEX "ObjectClueRevealRule_objectId_idx" ON "ObjectClueRevealRule"("objectId");

-- CreateIndex
CREATE INDEX "ObjectClueRevealRule_clueId_idx" ON "ObjectClueRevealRule"("clueId");

-- CreateIndex
CREATE INDEX "ClueDefinition_historyId_idx" ON "ClueDefinition"("historyId");

-- CreateIndex
CREATE UNIQUE INDEX "ConclusionDefinition_historyId_key" ON "ConclusionDefinition"("historyId");

-- CreateIndex
CREATE INDEX "ConclusionField_conclusionId_idx" ON "ConclusionField"("conclusionId");

-- CreateIndex
CREATE INDEX "ConclusionOption_fieldId_idx" ON "ConclusionOption"("fieldId");

-- CreateIndex
CREATE INDEX "EndingDefinition_historyId_idx" ON "EndingDefinition"("historyId");

-- CreateIndex
CREATE INDEX "HistorySession_userId_idx" ON "HistorySession"("userId");

-- CreateIndex
CREATE INDEX "HistorySession_historyId_idx" ON "HistorySession"("historyId");

-- CreateIndex
CREATE INDEX "SessionClue_sessionId_idx" ON "SessionClue"("sessionId");

-- CreateIndex
CREATE INDEX "SessionIntent_sessionId_idx" ON "SessionIntent"("sessionId");

-- CreateIndex
CREATE INDEX "CharacterSessionState_sessionId_idx" ON "CharacterSessionState"("sessionId");

-- CreateIndex
CREATE INDEX "SessionCharacterClueRevealRule_characterStateId_idx" ON "SessionCharacterClueRevealRule"("characterStateId");

-- CreateIndex
CREATE INDEX "SessionCharacterClueRevealRule_clueId_idx" ON "SessionCharacterClueRevealRule"("clueId");

-- CreateIndex
CREATE INDEX "CharacterSecretSessionState_characterStateId_idx" ON "CharacterSecretSessionState"("characterStateId");

-- CreateIndex
CREATE INDEX "SessionSecretRevealStage_secretStateId_idx" ON "SessionSecretRevealStage"("secretStateId");

-- CreateIndex
CREATE INDEX "LocationSessionState_sessionId_idx" ON "LocationSessionState"("sessionId");

-- CreateIndex
CREATE INDEX "ObjectSessionState_sessionId_idx" ON "ObjectSessionState"("sessionId");

-- CreateIndex
CREATE INDEX "SessionObjectClueRevealRule_objectStateId_idx" ON "SessionObjectClueRevealRule"("objectStateId");

-- CreateIndex
CREATE INDEX "SessionObjectClueRevealRule_clueId_idx" ON "SessionObjectClueRevealRule"("clueId");

-- CreateIndex
CREATE INDEX "ObjectInteractionMessage_objectStateId_idx" ON "ObjectInteractionMessage"("objectStateId");

-- CreateIndex
CREATE INDEX "CharacterConversationMessage_characterStateId_idx" ON "CharacterConversationMessage"("characterStateId");

-- CreateIndex
CREATE INDEX "SessionConclusionField_sessionId_idx" ON "SessionConclusionField"("sessionId");

-- CreateIndex
CREATE INDEX "SessionConclusionOption_fieldId_idx" ON "SessionConclusionOption"("fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionConclusion_sessionId_key" ON "SessionConclusion"("sessionId");

-- CreateIndex
CREATE INDEX "SessionConclusion_sessionId_idx" ON "SessionConclusion"("sessionId");

-- CreateIndex
CREATE INDEX "SessionConclusionAnswer_conclusionId_idx" ON "SessionConclusionAnswer"("conclusionId");

-- CreateIndex
CREATE INDEX "SessionConclusionAnswer_fieldId_idx" ON "SessionConclusionAnswer"("fieldId");

-- CreateIndex
CREATE INDEX "SessionConclusionAnswer_optionId_idx" ON "SessionConclusionAnswer"("optionId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionConclusionAnswer_conclusionId_fieldId_key" ON "SessionConclusionAnswer"("conclusionId", "fieldId");

-- CreateIndex
CREATE INDEX "SessionEndingSnapshot_sessionId_idx" ON "SessionEndingSnapshot"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionEnding_sessionId_key" ON "SessionEnding"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionEnding_endingSnapshotId_key" ON "SessionEnding"("endingSnapshotId");

-- CreateIndex
CREATE INDEX "SessionEnding_sessionId_idx" ON "SessionEnding"("sessionId");

-- CreateIndex
CREATE INDEX "SessionEnding_endingSnapshotId_idx" ON "SessionEnding"("endingSnapshotId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionScore_sessionEndingId_key" ON "SessionScore"("sessionEndingId");

-- CreateIndex
CREATE INDEX "_ObjectRevealRuleTriggerIntents_B_index" ON "_ObjectRevealRuleTriggerIntents"("B");

-- CreateIndex
CREATE INDEX "_SecretStageTriggerIntents_B_index" ON "_SecretStageTriggerIntents"("B");

-- CreateIndex
CREATE INDEX "_CharacterRevealRuleTriggerIntents_B_index" ON "_CharacterRevealRuleTriggerIntents"("B");

-- CreateIndex
CREATE INDEX "_CharacterRevealRuleRequiredClues_B_index" ON "_CharacterRevealRuleRequiredClues"("B");

-- CreateIndex
CREATE INDEX "_ObjectRevealRuleRequiredClues_B_index" ON "_ObjectRevealRuleRequiredClues"("B");

-- CreateIndex
CREATE INDEX "_SecretStageRequiredClues_B_index" ON "_SecretStageRequiredClues"("B");

-- CreateIndex
CREATE INDEX "_SecretStageRevealedClues_B_index" ON "_SecretStageRevealedClues"("B");

-- CreateIndex
CREATE INDEX "_LocationAmbientClues_B_index" ON "_LocationAmbientClues"("B");

-- CreateIndex
CREATE INDEX "_EndingRequiredClues_B_index" ON "_EndingRequiredClues"("B");

-- CreateIndex
CREATE INDEX "_ObjRuleRequiredClues_B_index" ON "_ObjRuleRequiredClues"("B");

-- CreateIndex
CREATE INDEX "_SessionSecretStageRequiredClues_B_index" ON "_SessionSecretStageRequiredClues"("B");

-- CreateIndex
CREATE INDEX "_SessionSecretStageRevealedClues_B_index" ON "_SessionSecretStageRevealedClues"("B");

-- CreateIndex
CREATE INDEX "_SessionEndingRequiredClues_B_index" ON "_SessionEndingRequiredClues"("B");

-- CreateIndex
CREATE INDEX "_ObjRuleTriggerIntents_B_index" ON "_ObjRuleTriggerIntents"("B");

-- CreateIndex
CREATE INDEX "_SessionSecretStageTriggerIntents_B_index" ON "_SessionSecretStageTriggerIntents"("B");

-- CreateIndex
CREATE INDEX "_CharStateRevealedClues_B_index" ON "_CharStateRevealedClues"("B");

-- CreateIndex
CREATE INDEX "_CharRuleTriggerIntents_B_index" ON "_CharRuleTriggerIntents"("B");

-- CreateIndex
CREATE INDEX "_CharRuleRequiredClues_B_index" ON "_CharRuleRequiredClues"("B");

-- CreateIndex
CREATE INDEX "_SecretStateRevealedClues_B_index" ON "_SecretStateRevealedClues"("B");

-- CreateIndex
CREATE INDEX "_SessionLocationAmbientClues_B_index" ON "_SessionLocationAmbientClues"("B");

-- CreateIndex
CREATE INDEX "_LocationRevealedAmbientClues_B_index" ON "_LocationRevealedAmbientClues"("B");

-- CreateIndex
CREATE INDEX "_ObjStateRevealedClues_B_index" ON "_ObjStateRevealedClues"("B");

-- AddForeignKey
ALTER TABLE "IntentDefinition" ADD CONSTRAINT "IntentDefinition_historyId_fkey" FOREIGN KEY ("historyId") REFERENCES "History"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterDefinition" ADD CONSTRAINT "CharacterDefinition_historyId_fkey" FOREIGN KEY ("historyId") REFERENCES "History"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterClueRevealRule" ADD CONSTRAINT "CharacterClueRevealRule_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "CharacterDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterClueRevealRule" ADD CONSTRAINT "CharacterClueRevealRule_clueId_fkey" FOREIGN KEY ("clueId") REFERENCES "ClueDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterSecret" ADD CONSTRAINT "CharacterSecret_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "CharacterDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecretRevealStage" ADD CONSTRAINT "SecretRevealStage_secretId_fkey" FOREIGN KEY ("secretId") REFERENCES "CharacterSecret"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationDefinition" ADD CONSTRAINT "LocationDefinition_historyId_fkey" FOREIGN KEY ("historyId") REFERENCES "History"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectDefinition" ADD CONSTRAINT "ObjectDefinition_historyId_fkey" FOREIGN KEY ("historyId") REFERENCES "History"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectDefinition" ADD CONSTRAINT "ObjectDefinition_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "LocationDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectClueRevealRule" ADD CONSTRAINT "ObjectClueRevealRule_objectId_fkey" FOREIGN KEY ("objectId") REFERENCES "ObjectDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectClueRevealRule" ADD CONSTRAINT "ObjectClueRevealRule_clueId_fkey" FOREIGN KEY ("clueId") REFERENCES "ClueDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClueDefinition" ADD CONSTRAINT "ClueDefinition_historyId_fkey" FOREIGN KEY ("historyId") REFERENCES "History"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConclusionDefinition" ADD CONSTRAINT "ConclusionDefinition_historyId_fkey" FOREIGN KEY ("historyId") REFERENCES "History"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConclusionField" ADD CONSTRAINT "ConclusionField_conclusionId_fkey" FOREIGN KEY ("conclusionId") REFERENCES "ConclusionDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConclusionOption" ADD CONSTRAINT "ConclusionOption_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "ConclusionField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EndingDefinition" ADD CONSTRAINT "EndingDefinition_historyId_fkey" FOREIGN KEY ("historyId") REFERENCES "History"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorySession" ADD CONSTRAINT "HistorySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionClue" ADD CONSTRAINT "SessionClue_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "HistorySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionIntent" ADD CONSTRAINT "SessionIntent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "HistorySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterSessionState" ADD CONSTRAINT "CharacterSessionState_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "HistorySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionCharacterClueRevealRule" ADD CONSTRAINT "SessionCharacterClueRevealRule_characterStateId_fkey" FOREIGN KEY ("characterStateId") REFERENCES "CharacterSessionState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionCharacterClueRevealRule" ADD CONSTRAINT "SessionCharacterClueRevealRule_clueId_fkey" FOREIGN KEY ("clueId") REFERENCES "SessionClue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterSecretSessionState" ADD CONSTRAINT "CharacterSecretSessionState_characterStateId_fkey" FOREIGN KEY ("characterStateId") REFERENCES "CharacterSessionState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionSecretRevealStage" ADD CONSTRAINT "SessionSecretRevealStage_secretStateId_fkey" FOREIGN KEY ("secretStateId") REFERENCES "CharacterSecretSessionState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationSessionState" ADD CONSTRAINT "LocationSessionState_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "HistorySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectSessionState" ADD CONSTRAINT "ObjectSessionState_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "HistorySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionObjectClueRevealRule" ADD CONSTRAINT "SessionObjectClueRevealRule_objectStateId_fkey" FOREIGN KEY ("objectStateId") REFERENCES "ObjectSessionState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionObjectClueRevealRule" ADD CONSTRAINT "SessionObjectClueRevealRule_clueId_fkey" FOREIGN KEY ("clueId") REFERENCES "SessionClue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObjectInteractionMessage" ADD CONSTRAINT "ObjectInteractionMessage_objectStateId_fkey" FOREIGN KEY ("objectStateId") REFERENCES "ObjectSessionState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterConversationMessage" ADD CONSTRAINT "CharacterConversationMessage_characterStateId_fkey" FOREIGN KEY ("characterStateId") REFERENCES "CharacterSessionState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionConclusionField" ADD CONSTRAINT "SessionConclusionField_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "HistorySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionConclusionOption" ADD CONSTRAINT "SessionConclusionOption_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "SessionConclusionField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionConclusion" ADD CONSTRAINT "SessionConclusion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "HistorySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionConclusionAnswer" ADD CONSTRAINT "SessionConclusionAnswer_conclusionId_fkey" FOREIGN KEY ("conclusionId") REFERENCES "SessionConclusion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionConclusionAnswer" ADD CONSTRAINT "SessionConclusionAnswer_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "SessionConclusionField"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionConclusionAnswer" ADD CONSTRAINT "SessionConclusionAnswer_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "SessionConclusionOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionEndingSnapshot" ADD CONSTRAINT "SessionEndingSnapshot_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "HistorySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionEnding" ADD CONSTRAINT "SessionEnding_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "HistorySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionEnding" ADD CONSTRAINT "SessionEnding_endingSnapshotId_fkey" FOREIGN KEY ("endingSnapshotId") REFERENCES "SessionEndingSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionScore" ADD CONSTRAINT "SessionScore_sessionEndingId_fkey" FOREIGN KEY ("sessionEndingId") REFERENCES "SessionEnding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ObjectRevealRuleTriggerIntents" ADD CONSTRAINT "_ObjectRevealRuleTriggerIntents_A_fkey" FOREIGN KEY ("A") REFERENCES "IntentDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ObjectRevealRuleTriggerIntents" ADD CONSTRAINT "_ObjectRevealRuleTriggerIntents_B_fkey" FOREIGN KEY ("B") REFERENCES "ObjectClueRevealRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SecretStageTriggerIntents" ADD CONSTRAINT "_SecretStageTriggerIntents_A_fkey" FOREIGN KEY ("A") REFERENCES "IntentDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SecretStageTriggerIntents" ADD CONSTRAINT "_SecretStageTriggerIntents_B_fkey" FOREIGN KEY ("B") REFERENCES "SecretRevealStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CharacterRevealRuleTriggerIntents" ADD CONSTRAINT "_CharacterRevealRuleTriggerIntents_A_fkey" FOREIGN KEY ("A") REFERENCES "CharacterClueRevealRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CharacterRevealRuleTriggerIntents" ADD CONSTRAINT "_CharacterRevealRuleTriggerIntents_B_fkey" FOREIGN KEY ("B") REFERENCES "IntentDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CharacterRevealRuleRequiredClues" ADD CONSTRAINT "_CharacterRevealRuleRequiredClues_A_fkey" FOREIGN KEY ("A") REFERENCES "CharacterClueRevealRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CharacterRevealRuleRequiredClues" ADD CONSTRAINT "_CharacterRevealRuleRequiredClues_B_fkey" FOREIGN KEY ("B") REFERENCES "ClueDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ObjectRevealRuleRequiredClues" ADD CONSTRAINT "_ObjectRevealRuleRequiredClues_A_fkey" FOREIGN KEY ("A") REFERENCES "ClueDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ObjectRevealRuleRequiredClues" ADD CONSTRAINT "_ObjectRevealRuleRequiredClues_B_fkey" FOREIGN KEY ("B") REFERENCES "ObjectClueRevealRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SecretStageRequiredClues" ADD CONSTRAINT "_SecretStageRequiredClues_A_fkey" FOREIGN KEY ("A") REFERENCES "ClueDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SecretStageRequiredClues" ADD CONSTRAINT "_SecretStageRequiredClues_B_fkey" FOREIGN KEY ("B") REFERENCES "SecretRevealStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SecretStageRevealedClues" ADD CONSTRAINT "_SecretStageRevealedClues_A_fkey" FOREIGN KEY ("A") REFERENCES "ClueDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SecretStageRevealedClues" ADD CONSTRAINT "_SecretStageRevealedClues_B_fkey" FOREIGN KEY ("B") REFERENCES "SecretRevealStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LocationAmbientClues" ADD CONSTRAINT "_LocationAmbientClues_A_fkey" FOREIGN KEY ("A") REFERENCES "ClueDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LocationAmbientClues" ADD CONSTRAINT "_LocationAmbientClues_B_fkey" FOREIGN KEY ("B") REFERENCES "LocationDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EndingRequiredClues" ADD CONSTRAINT "_EndingRequiredClues_A_fkey" FOREIGN KEY ("A") REFERENCES "ClueDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EndingRequiredClues" ADD CONSTRAINT "_EndingRequiredClues_B_fkey" FOREIGN KEY ("B") REFERENCES "EndingDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ObjRuleRequiredClues" ADD CONSTRAINT "_ObjRuleRequiredClues_A_fkey" FOREIGN KEY ("A") REFERENCES "SessionClue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ObjRuleRequiredClues" ADD CONSTRAINT "_ObjRuleRequiredClues_B_fkey" FOREIGN KEY ("B") REFERENCES "SessionObjectClueRevealRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SessionSecretStageRequiredClues" ADD CONSTRAINT "_SessionSecretStageRequiredClues_A_fkey" FOREIGN KEY ("A") REFERENCES "SessionClue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SessionSecretStageRequiredClues" ADD CONSTRAINT "_SessionSecretStageRequiredClues_B_fkey" FOREIGN KEY ("B") REFERENCES "SessionSecretRevealStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SessionSecretStageRevealedClues" ADD CONSTRAINT "_SessionSecretStageRevealedClues_A_fkey" FOREIGN KEY ("A") REFERENCES "SessionClue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SessionSecretStageRevealedClues" ADD CONSTRAINT "_SessionSecretStageRevealedClues_B_fkey" FOREIGN KEY ("B") REFERENCES "SessionSecretRevealStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SessionEndingRequiredClues" ADD CONSTRAINT "_SessionEndingRequiredClues_A_fkey" FOREIGN KEY ("A") REFERENCES "SessionClue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SessionEndingRequiredClues" ADD CONSTRAINT "_SessionEndingRequiredClues_B_fkey" FOREIGN KEY ("B") REFERENCES "SessionEndingSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ObjRuleTriggerIntents" ADD CONSTRAINT "_ObjRuleTriggerIntents_A_fkey" FOREIGN KEY ("A") REFERENCES "SessionIntent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ObjRuleTriggerIntents" ADD CONSTRAINT "_ObjRuleTriggerIntents_B_fkey" FOREIGN KEY ("B") REFERENCES "SessionObjectClueRevealRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SessionSecretStageTriggerIntents" ADD CONSTRAINT "_SessionSecretStageTriggerIntents_A_fkey" FOREIGN KEY ("A") REFERENCES "SessionIntent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SessionSecretStageTriggerIntents" ADD CONSTRAINT "_SessionSecretStageTriggerIntents_B_fkey" FOREIGN KEY ("B") REFERENCES "SessionSecretRevealStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CharStateRevealedClues" ADD CONSTRAINT "_CharStateRevealedClues_A_fkey" FOREIGN KEY ("A") REFERENCES "CharacterSessionState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CharStateRevealedClues" ADD CONSTRAINT "_CharStateRevealedClues_B_fkey" FOREIGN KEY ("B") REFERENCES "SessionClue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CharRuleTriggerIntents" ADD CONSTRAINT "_CharRuleTriggerIntents_A_fkey" FOREIGN KEY ("A") REFERENCES "SessionCharacterClueRevealRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CharRuleTriggerIntents" ADD CONSTRAINT "_CharRuleTriggerIntents_B_fkey" FOREIGN KEY ("B") REFERENCES "SessionIntent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CharRuleRequiredClues" ADD CONSTRAINT "_CharRuleRequiredClues_A_fkey" FOREIGN KEY ("A") REFERENCES "SessionCharacterClueRevealRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CharRuleRequiredClues" ADD CONSTRAINT "_CharRuleRequiredClues_B_fkey" FOREIGN KEY ("B") REFERENCES "SessionClue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SecretStateRevealedClues" ADD CONSTRAINT "_SecretStateRevealedClues_A_fkey" FOREIGN KEY ("A") REFERENCES "CharacterSecretSessionState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SecretStateRevealedClues" ADD CONSTRAINT "_SecretStateRevealedClues_B_fkey" FOREIGN KEY ("B") REFERENCES "SessionClue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SessionLocationAmbientClues" ADD CONSTRAINT "_SessionLocationAmbientClues_A_fkey" FOREIGN KEY ("A") REFERENCES "LocationSessionState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SessionLocationAmbientClues" ADD CONSTRAINT "_SessionLocationAmbientClues_B_fkey" FOREIGN KEY ("B") REFERENCES "SessionClue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LocationRevealedAmbientClues" ADD CONSTRAINT "_LocationRevealedAmbientClues_A_fkey" FOREIGN KEY ("A") REFERENCES "LocationSessionState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LocationRevealedAmbientClues" ADD CONSTRAINT "_LocationRevealedAmbientClues_B_fkey" FOREIGN KEY ("B") REFERENCES "SessionClue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ObjStateRevealedClues" ADD CONSTRAINT "_ObjStateRevealedClues_A_fkey" FOREIGN KEY ("A") REFERENCES "ObjectSessionState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ObjStateRevealedClues" ADD CONSTRAINT "_ObjStateRevealedClues_B_fkey" FOREIGN KEY ("B") REFERENCES "SessionClue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
