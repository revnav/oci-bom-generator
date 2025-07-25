import React from 'react';
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';

const LLMSelector = ({ providers, selected, onSelect }) => {
  const selectedProvider = providers.find(p => p.id === selected);

  return (
    <div className="w-full">
      <Listbox value={selected} onChange={onSelect}>
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-white py-3 pl-4 pr-10 text-left border border-gray-300 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <span className="block font-medium text-gray-900">
                  {selectedProvider?.name || 'Select LLM Provider'}
                </span>
                {selectedProvider && (
                  <span className="block text-sm text-gray-500 mt-1">
                    {selectedProvider.cost}
                  </span>
                )}
              </div>
              <span className="pointer-events-none flex items-center">
                <ChevronDownIcon
                  className="h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </span>
            </div>
          </Listbox.Button>
          
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              {providers.map((provider) => (
                <Listbox.Option
                  key={provider.id}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-3 pl-4 pr-10 ${
                      active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                    }`
                  }
                  value={provider.id}
                >
                  {({ selected: isSelected, active }) => (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <span
                          className={`block font-medium ${
                            isSelected ? 'text-blue-600' : 'text-gray-900'
                          }`}
                        >
                          {provider.name}
                        </span>
                        <span
                          className={`block text-sm mt-1 ${
                            active ? 'text-blue-700' : 'text-gray-500'
                          }`}
                        >
                          {provider.cost}
                        </span>
                        {provider.id === 'gemini' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                            Best for documents
                          </span>
                        )}
                        {provider.id === 'claude' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                            Recommended
                          </span>
                        )}
                        {provider.id === 'deepseek' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                            Most cost-effective
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <span className="flex items-center text-blue-600">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      )}
                    </div>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
      
      {/* Provider comparison info */}
      <div className="mt-3 text-xs text-gray-500">
        <div className="grid grid-cols-1 gap-1">
          <div>💡 <strong>Claude:</strong> Best for structured analysis</div>
          <div>🔍 <strong>Gemini:</strong> Superior document processing</div>
          <div>💰 <strong>DeepSeek:</strong> Most cost-effective option</div>
        </div>
      </div>
    </div>
  );
};

export default LLMSelector;