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
    
    return {
        positive_points: [
            messageCount > 0 ? `Bonne participation avec ${messageCount} contributions` : "Session terminée avec succès",
            "Interaction positive avec l'IA",
            messageCount > 3 ? "Engagement soutenu dans la conversation" : "Bonne base de communication"
        ],
        progress: [
            "Progression continue dans l'apprentissage",
            "Développement des compétences linguistiques",
            messageCount > 5 ? "Amélioration de la fluidité" : "Établissement des bases"
        ],
        improvement_areas: [
            "Continuer à pratiquer régulièrement",
            "Diversifier les sujets de conversation",
            "Travailler sur la prononciation",
            "Enrichir le vocabulaire"
        ],
        recurring_errors: [
            "Aucune erreur récurrente majeure détectée",
            "Quelques hésitations normales pour ce niveau"
        ],
        suggested_exercises: [
            {
                title: "Conversation libre",
                description: "Pratiquer la conversation sur des sujets variés",
                difficulty: "Intermédiaire",
                duration: "15-20 minutes",
                openingMessage: "Parlons librement de sujets qui vous intéressent."
            },
            {
                title: "Exercice de vocabulaire",
                description: "Enrichir le vocabulaire avec de nouveaux mots",
                difficulty: "Facile",
                duration: "10-15 minutes",
                openingMessage: "Nous allons enrichir votre vocabulaire avec de nouveaux mots utiles."
            }
        ]
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