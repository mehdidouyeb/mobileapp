/**
 * Analysis Service
 * 
 * Service pour capturer et analyser les réponses JSON de l'IA
 */

/**
 * Extrait l'analyse JSON de la réponse de l'IA
 * @param {string} aiResponse - Réponse complète de l'IA
 * @returns {Object|null} - Analyse extraite ou null si pas trouvée
 */
export function extractAnalysisFromResponse(aiResponse) {
    if (!aiResponse) return null;
    
    try {
        // Chercher un JSON dans la réponse
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;
        
        const jsonString = jsonMatch[0];
        const analysis = JSON.parse(jsonString);
        
        // Vérifier si c'est une analyse valide
        if (analysis.positive_points || analysis.progress || analysis.improvement_areas) {
            return analysis;
        }
        
        return null;
    } catch (error) {
        console.error('Erreur lors de l\'extraction de l\'analyse:', error);
        return null;
    }
}

/**
 * Génère une analyse par défaut si l'IA n'en fournit pas
 * @param {Array} messages - Messages de la session
 * @returns {Object} - Analyse par défaut
 */
export function generateDefaultAnalysis(messages = []) {
    const userMessages = messages.filter(msg => msg.isUser);
    const messageCount = userMessages.length;
    
    // Détecter les erreurs linguistiques
    const detectedErrors = detectErrorPatterns(messages);
    
    // Points positifs basés sur la participation
    const positivePoints = [
        messageCount > 0 ? `Excellente participation avec ${messageCount} contributions` : "Session terminée avec succès",
        messageCount > 3 ? "Engagement soutenu et interaction fluide" : "Bonne participation de base",
        messageCount > 5 ? "Conversation développée avec plusieurs échanges" : "Interaction positive établie"
    ];
    
    // Progression basée sur la qualité
    const progress = [
        "Développement progressif des compétences linguistiques",
        messageCount > 3 ? "Amélioration visible dans la fluidité" : "Établissement d'une base solide",
        detectedErrors.length === 0 ? "Pas d'erreurs récurrentes majeures détectées" : `${detectedErrors.length} zone(s) d'amélioration identifiée(s)`
    ];
    
    // Zones d'amélioration basées sur les erreurs détectées
    const improvementAreas = detectedErrors.length > 0 
        ? detectedErrors.map(error => error.suggestion)
        : [
            "Continuer à pratiquer régulièrement",
            "Diversifier les sujets de conversation",
            "Enrichir progressivement le vocabulaire"
        ];
    
    // Erreurs récurrentes
    const recurringErrors = detectedErrors.length > 0
        ? detectedErrors.map(error => `${error.pattern}: ${error.example} (apparu ${error.frequency} fois)`)
        : [
            "Aucune erreur récurrente majeure observée dans cette session",
            "Quelques hésitations normales et attendues à ce niveau"
        ];
    
    // Générer des exercices ciblés basés sur les erreurs
    const suggestedExercises = generateTargetedExercises(detectedErrors);
    
    return {
        positive_points: positivePoints,
        progress: progress,
        improvement_areas: improvementAreas,
        recurring_errors: recurringErrors,
        suggested_exercises: suggestedExercises
    };
}

/**
 * Analyse les messages pour générer des insights
 * @param {Array} messages - Messages de la session
 * @returns {Object} - Insights générés
 */
export function analyzeMessages(messages = []) {
    const userMessages = messages.filter(msg => msg.isUser);
    const aiMessages = messages.filter(msg => !msg.isUser);
    
    // Métriques de base
    const participation = {
        userMessageCount: userMessages.length,
        aiMessageCount: aiMessages.length,
        participationRatio: userMessages.length / (userMessages.length + aiMessages.length) || 0
    };
    
    // Analyse du contenu
    const allUserText = userMessages.map(msg => msg.text || '').join(' ').toLowerCase();
    const words = allUserText.split(/\s+/).filter(word => word.length > 2);
    const uniqueWords = new Set(words);
    
    const structure = {
        totalWords: words.length,
        uniqueWords: uniqueWords.size,
        avgMessageLength: userMessages.reduce((sum, msg) => sum + (msg.text?.length || 0), 0) / userMessages.length || 0
    };
    
    return {
        participation,
        structure,
        timestamp: new Date().toISOString()
    };
}

/**
 * Détecte les patterns d'erreurs linguistiques dans les messages
 * @param {Array} messages - Messages de la session
 * @returns {Array} - Liste des erreurs détectées avec suggestions
 */
export function detectErrorPatterns(messages = []) {
    const userMessages = messages.filter(msg => msg.isUser && msg.text);
    if (userMessages.length === 0) return [];
    
    const errors = [];
    const textSamples = userMessages.map(msg => msg.text.toLowerCase().trim());
    
    // Détecter les erreurs grammaticales communes
    // 1. Verbes irréguliers au passé (goed, eated, etc.)
    const irregularVerbMistakes = textSamples.filter(text => 
        /\b(goed|eated|runned|catched|buyed|drinked|eat|eaten wrongly)\b/.test(text)
    );
    if (irregularVerbMistakes.length > 0) {
        errors.push({
            type: 'grammar',
            pattern: 'Past tense irregular verbs',
            example: irregularVerbMistakes[0],
            suggestion: 'Practice irregular past tense forms (go → went, eat → ate, run → ran)',
            frequency: irregularVerbMistakes.length
        });
    }
    
    // 2. Omission d'articles (a, an, the)
    const noArticleSamples = textSamples.filter(text => 
        /\b(i want|i need|i have|i like|i went to|i bought|i saw)\s+[a-z]+\s/.test(text) && 
        !/\b(i want a|i need a|i have a|i like the|i went to the|i bought a|i saw a)\s/.test(text)
    );
    if (noArticleSamples.length > 1) {
        errors.push({
            type: 'grammar',
            pattern: 'Missing articles',
            example: noArticleSamples[0],
            suggestion: 'Remember to use articles "a", "an", or "the" before nouns',
            frequency: noArticleSamples.length
        });
    }
    
    // 3. Repétition excessive de mots simples
    const allWords = textSamples.join(' ').split(/\s+/);
    const wordFrequency = {};
    allWords.forEach(word => {
        if (word.length > 2) {
            wordFrequency[word] = (wordFrequency[word] || 0) + 1;
        }
    });
    
    const overusedWords = Object.entries(wordFrequency)
        .filter(([word, count]) => count >= 5 && !['the', 'and', 'you', 'i', 'is', 'are', 'was', 'were', 'with', 'that', 'this', 'for', 'have', 'has', 'can', 'will', 'would', 'could'].includes(word))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
    
    if (overusedWords.length > 0) {
        errors.push({
            type: 'vocabulary',
            pattern: 'Limited word variety',
            example: `Using "${overusedWords[0][0]}" ${overusedWords[0][1]} times`,
            suggestion: 'Expand vocabulary with synonyms and alternatives',
            frequency: overusedWords[0][1]
        });
    }
    
    // 4. Phrases très courtes ou incomplètes
    const shortMessages = userMessages.filter(msg => msg.text.trim().split(/\s+/).length <= 3);
    if (shortMessages.length > userMessages.length * 0.5) {
        errors.push({
            type: 'fluency',
            pattern: 'Short or incomplete sentences',
            example: shortMessages[0]?.text || 'Short phrases',
            suggestion: 'Try to form longer, more complete sentences',
            frequency: shortMessages.length
        });
    }
    
    // 5. Confusion entre there/their/they're
    const thereConfusion = textSamples.filter(text => 
        /\b(there|their|theyre|they\'re)\b/.test(text) && 
        text.includes('there') && (text.includes('their') || text.includes('they'))
    );
    if (thereConfusion.length > 0) {
        errors.push({
            type: 'grammar',
            pattern: 'there/their/they\'re confusion',
            example: thereConfusion[0],
            suggestion: 'Learn the difference: there (place), their (possession), they\'re (contraction)',
            frequency: thereConfusion.length
        });
    }
    
    // 6. Manque de conjonctions ou connecteurs
    const noConnectors = textSamples.filter(text => 
        text.length > 50 && 
        !/\b(and|but|because|so|however|although|if|when|while|then)\b/.test(text)
    );
    if (noConnectors.length > 2) {
        errors.push({
            type: 'fluency',
            pattern: 'Missing linking words',
            example: noConnectors[0],
            suggestion: 'Use connecting words to link ideas (and, but, because, however)',
            frequency: noConnectors.length
        });
    }
    
    return errors.sort((a, b) => b.frequency - a.frequency).slice(0, 5); // Top 5 erreurs
}

/**
 * Crée des exercices ciblés basés sur les erreurs détectées
 * @param {Array} errors - Liste des erreurs détectées
 * @returns {Array} - Liste d'exercices ciblés
 */
export function generateTargetedExercises(errors) {
    const exercises = [];
    
    errors.forEach((error, index) => {
        switch (error.type) {
            case 'grammar':
                if (error.pattern.includes('Past tense')) {
                    exercises.push({
                        title: `Grammar Fix: ${error.pattern}`,
                        description: error.suggestion,
                        difficulty: 'A2-B1',
                        duration: '10-15 minutes',
                        openingMessage: `Let's practice irregular past tense! I'll give you verbs and you'll say their past forms. For example: "go" → "went". Ready? Start with: "eat" → ?`
                    });
                } else if (error.pattern.includes('articles')) {
                    exercises.push({
                        title: 'Grammar Fix: Articles (a, an, the)',
                        description: error.suggestion,
                        difficulty: 'A1-A2',
                        duration: '8-12 minutes',
                        openingMessage: `Let's practice using articles correctly! I'll describe scenarios and you'll complete sentences with "a", "an", or "the". Ready? "I want ___ apple."`
                    });
                } else if (error.pattern.includes('there')) {
                    exercises.push({
                        title: 'Grammar Fix: there/their/they\'re',
                        description: error.suggestion,
                        difficulty: 'A2-B1',
                        duration: '8-10 minutes',
                        openingMessage: `Let's practice there/their/they're! Remember: "there" = place, "their" = possession, "they're" = they are. Fill in: "___ book is on the table" (their)`
                    });
                }
                break;
                
            case 'vocabulary':
                exercises.push({
                    title: 'Vocabulary Expansion',
                    description: error.suggestion,
                    difficulty: 'B1-B2',
                    duration: '12-15 minutes',
                    openingMessage: `Let's expand your vocabulary! Instead of using the same words, let's explore synonyms and alternatives. For example, instead of "good", we can say: great, excellent, wonderful, amazing. Let's practice!`
                });
                break;
                
            case 'fluency':
                if (error.pattern.includes('sentences')) {
                    exercises.push({
                        title: 'Fluency: Building Complex Sentences',
                        description: error.suggestion,
                        difficulty: 'B1-B2',
                        duration: '15-20 minutes',
                        openingMessage: `Let's build longer, more detailed sentences! Instead of "I like pizza", try "I really enjoy eating pizza because it's delicious and makes me happy." Try expanding: "I went to the store."`
                    });
                } else if (error.pattern.includes('linking')) {
                    exercises.push({
                        title: 'Fluency: Connecting Ideas',
                        description: error.suggestion,
                        difficulty: 'B1-B2',
                        duration: '10-15 minutes',
                        openingMessage: `Let's learn to connect ideas smoothly! Use words like "and", "but", "because", "however" to link sentences. For example: "I love coffee ___ it keeps me awake." (because)`
                    });
                }
                break;
        }
    });
    
    // Si aucun exercice spécifique n'a été créé, proposer des exercices généraux
    if (exercises.length === 0) {
        exercises.push({
            title: "Conversation Practice",
            description: "Practice speaking naturally on various topics",
            difficulty: "Intermediate",
            duration: "15-20 minutes",
            openingMessage: "Let's have a natural conversation! Tell me about your day or something interesting that happened to you recently."
        });
    }
    
    return exercises;
}