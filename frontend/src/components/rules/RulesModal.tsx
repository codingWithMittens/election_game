import { useState } from 'react';
import gameRules from '../../data/gameRules.json';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type RulesSection =
  | 'overview'
  | 'setup'
  | 'turnStructure'
  | 'cardTypes'
  | 'cardSelection'
  | 'stateLean'
  | 'electoralVotes'
  | 'strategy'
  | 'uiElements'
  | 'quickReference';

function RulesModal({ isOpen, onClose }: RulesModalProps) {
  const [activeSection, setActiveSection] = useState<RulesSection>('overview');

  if (!isOpen) return null;

  const sections: { id: RulesSection; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '🎯' },
    { id: 'setup', label: 'Setup', icon: '⚙️' },
    { id: 'turnStructure', label: 'Your Turn', icon: '🔄' },
    { id: 'cardTypes', label: 'Card Types', icon: '🃏' },
    { id: 'cardSelection', label: 'Target States', icon: '🎯' },
    { id: 'stateLean', label: 'State Lean', icon: '📊' },
    { id: 'electoralVotes', label: 'Electoral College', icon: '🗳️' },
    { id: 'strategy', label: 'Strategy Tips', icon: '💡' },
    { id: 'uiElements', label: 'UI Guide', icon: '🖥️' },
    { id: 'quickReference', label: 'Quick Reference', icon: '⚡' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-red-600 text-white px-6 py-4 rounded-t-xl flex justify-between items-center">
          <h2 className="text-2xl font-bold">Game Rules & Guide</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-64 bg-gray-50 border-r overflow-y-auto">
            <nav className="p-4 space-y-1">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                    activeSection === section.id
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-xl">{section.icon}</span>
                  <span>{section.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeSection === 'overview' && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-900">{gameRules.overview.title}</h3>
                <p className="text-lg text-gray-700">{gameRules.overview.description}</p>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 font-semibold">Players</div>
                    <div className="text-2xl font-bold text-blue-600">{gameRules.overview.players}</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 font-semibold">Play Time</div>
                    <div className="text-2xl font-bold text-red-600">{gameRules.overview.playTime}</div>
                  </div>
                </div>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-6">
                  <p className="text-yellow-800 font-semibold">{gameRules.victory.condition}</p>
                  <p className="text-yellow-700 text-sm mt-1">{gameRules.victory.description}</p>
                </div>
              </div>
            )}

            {activeSection === 'setup' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">{gameRules.setup.title}</h3>
                {gameRules.setup.steps.map((step) => (
                  <div key={step.step} className="bg-gray-50 p-5 rounded-lg">
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-lg mb-2">{step.title}</h4>
                        <p className="text-gray-700">{step.description}</p>
                        {step.tooltip && (
                          <div className="mt-2 text-sm text-blue-600 italic">💡 {step.tooltip}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'turnStructure' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">{gameRules.turnStructure.title}</h3>
                <p className="text-lg text-gray-700">{gameRules.turnStructure.description}</p>
                {gameRules.turnStructure.phases.map((phase, idx) => (
                  <div key={idx} className="border-l-4 border-green-500 bg-green-50 p-5 rounded">
                    <h4 className="font-bold text-gray-900 text-lg mb-2">{phase.phase}</h4>
                    <p className="text-gray-700 mb-3">{phase.description}</p>
                    {phase.actions && (
                      <div className="space-y-3 mt-4">
                        {phase.actions.map((action, aidx) => (
                          <div key={aidx} className="bg-white p-3 rounded border border-green-200">
                            <div className="font-semibold text-green-800">{action.action}</div>
                            <div className="text-sm text-gray-600 mt-1">{action.description}</div>
                            {action.tooltip && <div className="text-xs text-gray-500 italic mt-1">💡 {action.tooltip}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                    {phase.specialCases && (
                      <div className="space-y-2 mt-4">
                        <div className="font-semibold text-gray-800">Special Cases:</div>
                        {phase.specialCases.map((sc, scidx) => (
                          <div key={scidx} className="bg-white p-3 rounded border border-amber-200">
                            <div className="font-semibold text-amber-800">{sc.case}</div>
                            <div className="text-sm text-gray-600 mt-1">Effect: {sc.effect}</div>
                            <div className="text-xs text-blue-600 font-mono mt-1">Button: "{sc.button}"</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {phase.tooltip && <div className="text-sm text-green-700 italic mt-3">💡 {phase.tooltip}</div>}
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'cardTypes' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">{gameRules.cardTypes.title}</h3>
                <div className="grid gap-4">
                  {gameRules.cardTypes.types.map((type) => (
                    <div key={type.type} className={`border-l-4 p-5 rounded bg-${type.color}-50 border-${type.color}-500`}>
                      <h4 className={`font-bold text-${type.color}-900 text-lg mb-2`}>{type.type} Cards</h4>
                      <p className="text-gray-700 mb-2">{type.description}</p>
                      <div className="text-sm text-gray-600 mb-2"><strong>Effect:</strong> {type.effect}</div>
                      <div className="text-sm text-gray-600 mb-2"><strong>Targeting:</strong> {type.targeting}</div>
                      <div className="text-xs text-gray-500 italic">Examples: {type.examples.join(', ')}</div>
                      {type.tooltip && <div className="text-sm text-blue-600 italic mt-2">💡 {type.tooltip}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'cardSelection' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">{gameRules.cardSelection.title}</h3>
                {gameRules.cardSelection.rules.map((rule) => (
                  <div key={rule.type} className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-lg border border-purple-200">
                    <h4 className="font-bold text-purple-900 text-lg mb-2">{rule.name}</h4>
                    <p className="text-gray-700 mb-3">{rule.description}</p>
                    <div className="bg-white p-3 rounded border border-purple-100">
                      <div className="font-semibold text-purple-800 text-sm">What to do:</div>
                      <div className="text-gray-700">{rule.userAction}</div>
                    </div>
                    <div className="mt-3 text-sm text-gray-600">
                      <strong>How to tell:</strong> {rule.indicator}
                    </div>
                    {rule.tooltip && <div className="text-sm text-purple-600 italic mt-2">💡 {rule.tooltip}</div>}
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'stateLean' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">{gameRules.stateLean.title}</h3>
                <p className="text-lg text-gray-700">{gameRules.stateLean.description}</p>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                  <div className="font-bold text-yellow-900">Control Threshold: ±{gameRules.stateLean.controlThreshold.value}</div>
                  <div className="text-yellow-800 text-sm mt-1">{gameRules.stateLean.controlThreshold.description}</div>
                </div>
                <div className="space-y-2">
                  {gameRules.stateLean.scale.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 rounded" style={{ backgroundColor: item.color + '20' }}>
                      <div className="w-24 h-12 rounded" style={{ backgroundColor: item.color }}></div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900">{item.category}</div>
                        <div className="text-sm text-gray-600">Range: {item.range}</div>
                        <div className="text-sm text-gray-700">Controlled by: <strong>{item.controlled}</strong></div>
                        <div className="text-xs text-gray-500 italic">{item.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'electoralVotes' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">{gameRules.electoralVotes.title}</h3>
                <p className="text-lg text-gray-700">{gameRules.electoralVotes.description}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-6 rounded-lg text-center">
                    <div className="text-sm text-gray-600 font-semibold">Total Electoral Votes</div>
                    <div className="text-4xl font-bold text-blue-600">{gameRules.electoralVotes.total}</div>
                  </div>
                  <div className="bg-green-50 p-6 rounded-lg text-center">
                    <div className="text-sm text-gray-600 font-semibold">Needed to Win</div>
                    <div className="text-4xl font-bold text-green-600">{gameRules.electoralVotes.toWin}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg mb-3">Highest Value States</h4>
                  <div className="grid grid-cols-5 gap-2">
                    {gameRules.electoralVotes.highestValue.map((state) => (
                      <div key={state.state} className="bg-gray-100 p-3 rounded text-center">
                        <div className="font-bold text-gray-900">{state.state}</div>
                        <div className="text-2xl font-bold text-blue-600">{state.votes}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg mb-3">Key Swing States</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {gameRules.electoralVotes.swingStates.map((state) => (
                      <div key={state.state} className="bg-purple-50 p-4 rounded border border-purple-200">
                        <div className="flex justify-between items-center">
                          <div className="font-bold text-gray-900 text-lg">{state.state}</div>
                          <div className="text-2xl font-bold text-purple-600">{state.votes} EV</div>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Starting Lean: {state.startingLean}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'strategy' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">{gameRules.strategy.title}</h3>
                {gameRules.strategy.tips.map((tip, idx) => (
                  <div key={idx} className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-lg border-l-4 border-amber-500">
                    <div className="text-sm text-amber-600 font-semibold uppercase">{tip.category}</div>
                    <h4 className="font-bold text-gray-900 text-lg mt-1 mb-2">{tip.tip}</h4>
                    <p className="text-gray-700 mb-2">{tip.description}</p>
                    {tip.tooltip && <div className="text-sm text-amber-700 italic">💡 {tip.tooltip}</div>}
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'uiElements' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">{gameRules.uiElements.title}</h3>
                {gameRules.uiElements.elements.map((element, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm">
                    <h4 className="font-bold text-gray-900 text-lg mb-1">{element.element}</h4>
                    <div className="text-sm text-gray-500 mb-3">{element.location}</div>
                    <p className="text-gray-700 mb-3">{element.description}</p>
                    {element.interaction && (
                      <div className="bg-blue-50 p-3 rounded mb-3">
                        <div className="text-sm font-semibold text-blue-900">Interaction:</div>
                        <div className="text-sm text-blue-800">{element.interaction}</div>
                      </div>
                    )}
                    {element.tooltip && <div className="text-sm text-gray-600 italic">💡 {element.tooltip}</div>}
                  </div>
                ))}
              </div>
            )}

            {activeSection === 'quickReference' && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">{gameRules.quickReference.title}</h3>
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-blue-200">
                  <ul className="space-y-3">
                    {gameRules.quickReference.keyFacts.map((fact, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="text-blue-600 text-xl">✓</span>
                        <span className="text-gray-900 text-lg">{fact}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RulesModal;
