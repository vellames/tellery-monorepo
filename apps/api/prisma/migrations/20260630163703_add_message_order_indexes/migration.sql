-- CreateIndex
CREATE INDEX "CharacterConversationMessage_characterStateId_createdAt_idx" ON "CharacterConversationMessage"("characterStateId", "createdAt");

-- CreateIndex
CREATE INDEX "ObjectInteractionMessage_objectStateId_createdAt_idx" ON "ObjectInteractionMessage"("objectStateId", "createdAt");
