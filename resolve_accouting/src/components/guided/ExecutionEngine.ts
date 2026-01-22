/**
 * Execution Engine
 * Executes action steps with visual feedback
 */

import { ActionStep } from './ActionPlanner';
import toast from 'react-hot-toast';

export interface ExecutionResult {
  stepId: string;
  success: boolean;
  message: string;
  timestamp: string;
  duration: number;
}

class ExecutionEngine {
  static async executeStep(step: ActionStep): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      switch (step.type) {
        case 'navigate':
          return await this.executeNavigate(step, startTime);
        
        case 'select':
          return await this.executeSelect(step, startTime);
        
        case 'click':
          return await this.executeClick(step, startTime);
        
        case 'input':
          return await this.executeInput(step, startTime);
        
        case 'wait':
          return await this.executeWait(step, startTime);
        
        case 'validate':
          return await this.executeValidate(step, startTime);
        
        case 'confirm':
          return await this.executeConfirm(step, startTime);
        
        default:
          return {
            stepId: step.id,
            success: false,
            message: `Unknown step type: ${step.type}`,
            timestamp: new Date().toISOString(),
            duration: Date.now() - startTime,
          };
      }
    } catch (error: any) {
      return {
        stepId: step.id,
        success: false,
        message: error.message || 'Execution failed',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      };
    }
  }

  private static async executeNavigate(step: ActionStep, startTime: number): Promise<ExecutionResult> {
    try {
      const target = step.target;
      
      // Trigger navigation via custom event
      window.dispatchEvent(new CustomEvent('guided-navigate', { detail: { route: target } }));
      
      // Wait for navigation to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify navigation by checking if we're on the right route
      const currentPath = window.location.pathname;
      const isNavigated = currentPath === target || currentPath.startsWith(target);
      
      return {
        stepId: step.id,
        success: isNavigated,
        message: isNavigated ? `Navigated to ${target}` : `Navigation may have failed. Current path: ${currentPath}`,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        stepId: step.id,
        success: false,
        message: `Navigation error: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      };
    }
  }

  private static async executeSelect(step: ActionStep, startTime: number): Promise<ExecutionResult> {
    try {
      // Skip if value is null or undefined
      if (!step.value && step.value !== 0 && step.value !== '') {
        return {
          stepId: step.id,
          success: true,
          message: `Skipped selection (no value provided): ${step.description}`,
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
        };
      }

      // Wait for element to be available (retry logic)
      let element: Element | null = null;
      let retries = 10;
      while (!element && retries > 0) {
        element = document.querySelector(step.target);
        if (!element) {
          await new Promise(resolve => setTimeout(resolve, 200));
          retries--;
        }
      }
      
      if (!element) {
        return {
          stepId: step.id,
          success: false,
          message: `Element not found after retries: ${step.target}`,
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
        };
      }

      // Highlight element briefly
      element.classList.add('guided-highlight');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Trigger selection
      if (element instanceof HTMLSelectElement) {
        // Convert value to string for comparison
        const searchValue = String(step.value);
        
        // Try to find option by exact value match first
        let option = Array.from(element.options).find(
          opt => opt.value === searchValue || opt.value === step.value
        );
        
        // If not found, try partial text match with better period matching
        if (!option && searchValue) {
          const searchLower = searchValue.toLowerCase();
          // Extract month and year from search value (e.g., "December-2025" -> "december" and "2025")
          const monthMatch = searchLower.match(/(january|february|march|april|may|june|july|august|september|october|november|december)/);
          const yearMatch = searchLower.match(/(20\d{2})/);
          const month = monthMatch ? monthMatch[1] : null;
          const year = yearMatch ? yearMatch[1] : null;
          
          // Try various matching strategies
          option = Array.from(element.options).find(
            opt => {
              const optText = opt.text.toLowerCase();
              const optValue = opt.value.toLowerCase();
              
              // Exact or partial text match
              if (optText.includes(searchLower) || searchLower.includes(optText) ||
                  optValue.includes(searchLower) || searchLower.includes(optValue)) {
                return true;
              }
              
              // Month-based matching (e.g., "December-2025" matches "Dec-2025" or "December 2025")
              if (month) {
                const monthAbbrev = month.substring(0, 3); // "dec" for "december"
                if ((optText.includes(month) || optText.includes(monthAbbrev)) &&
                    (!year || optText.includes(year) || optValue.includes(year))) {
                  return true;
                }
              }
              
              // Year-only matching if month not found
              if (year && !month && (optText.includes(year) || optValue.includes(year))) {
                return true;
              }
              
              return false;
            }
          );
        }
        
        // If still not found and value is 'current', try to find first available option
        if (!option && (searchValue === 'current' || searchValue === 'Current Year')) {
          // Find first non-empty option
          option = Array.from(element.options).find(opt => opt.value && opt.value !== '');
        }
        
        if (option && option.value) {
          element.value = option.value;
          // Trigger React onChange handler
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLSelectElement.prototype,
            'value'
          )?.set;
          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(element, option.value);
          }
          
          // Dispatch events
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          
          // Also trigger React's synthetic event
          const reactEvent = new Event('change', { bubbles: true });
          Object.defineProperty(reactEvent, 'target', { value: element, enumerable: true });
          element.dispatchEvent(reactEvent);
        } else {
          element.classList.remove('guided-highlight');
          return {
            stepId: step.id,
            success: false,
            message: `Option not found for value: ${step.value}. Available options: ${Array.from(element.options).slice(0, 5).map(o => o.text).join(', ')}`,
            timestamp: new Date().toISOString(),
            duration: Date.now() - startTime,
          };
        }
      } else {
        // For custom dropdowns, trigger click
        (element as HTMLElement).click();
        // Wait for dropdown to open, then select
        await new Promise(resolve => setTimeout(resolve, 300));
        const optionElement = document.querySelector(`[data-value="${step.value}"]`);
        if (optionElement) {
          (optionElement as HTMLElement).click();
        } else {
          element.classList.remove('guided-highlight');
          return {
            stepId: step.id,
            success: false,
            message: `Dropdown option not found: ${step.value}`,
            timestamp: new Date().toISOString(),
            duration: Date.now() - startTime,
          };
        }
      }

      element.classList.remove('guided-highlight');
      element.style.transform = '';
      
      // Wait a bit to ensure selection is processed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        stepId: step.id,
        success: true,
        message: `Selected: ${step.value}`,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        stepId: step.id,
        success: false,
        message: `Selection error: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      };
    }
  }

  private static async executeClick(step: ActionStep, startTime: number): Promise<ExecutionResult> {
    try {
      // Wait for element to be available (retry logic)
      let element: Element | null = null;
      let retries = 10;
      while (!element && retries > 0) {
        element = document.querySelector(step.target);
        if (!element) {
          await new Promise(resolve => setTimeout(resolve, 200));
          retries--;
        }
      }
      
      if (!element) {
        return {
          stepId: step.id,
          success: false,
          message: `Element not found after retries: ${step.target}`,
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
        };
      }

      // Check if element is disabled
      if ((element as HTMLElement).hasAttribute('disabled') || 
          (element as HTMLElement).getAttribute('disabled') === 'true') {
        return {
          stepId: step.id,
          success: false,
          message: `Element is disabled: ${step.target}`,
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
        };
      }

      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await new Promise(resolve => setTimeout(resolve, 300));

      // Highlight element with stronger visual feedback
      element.classList.add('guided-highlight');
      element.style.transition = 'all 0.3s ease';
      element.style.transform = 'scale(1.05)';
      element.style.boxShadow = '0 0 0 3px rgba(0, 184, 169, 0.5)';
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Click the element
      (element as HTMLElement).click();
      
      // Also try mouse events for better compatibility
      const mouseEvents = ['mousedown', 'mouseup', 'click'];
      mouseEvents.forEach(eventType => {
        const event = new MouseEvent(eventType, {
          bubbles: true,
          cancelable: true,
          view: window,
        });
        element?.dispatchEvent(event);
      });
      
      element.classList.remove('guided-highlight');
      element.style.transform = '';
      element.style.boxShadow = '';
      
      // Wait a bit to ensure click is processed
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        stepId: step.id,
        success: true,
        message: `Clicked: ${step.description}`,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        stepId: step.id,
        success: false,
        message: `Click error: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      };
    }
  }

  private static async executeInput(step: ActionStep, startTime: number): Promise<ExecutionResult> {
    const element = document.querySelector(step.target) as HTMLInputElement;
    
    if (!element) {
      return {
        stepId: step.id,
        success: false,
        message: `Input element not found: ${step.target}`,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      };
    }

    element.focus();
    element.value = step.value || '';
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    return {
      stepId: step.id,
      success: true,
      message: `Input value: ${step.value}`,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    };
  }

  private static async executeWait(step: ActionStep, startTime: number): Promise<ExecutionResult> {
    try {
      // Wait for element to appear AND for API data to load (for select elements)
      const maxWait = 20000; // 20 seconds (increased for API responses)
      const checkInterval = 300;
      let elapsed = 0;

      while (elapsed < maxWait) {
        const element = document.querySelector(step.target);
        if (element) {
          // Additional check: ensure element is visible and not disabled
          const isVisible = (element as HTMLElement).offsetParent !== null;
          const isDisabled = (element as HTMLElement).hasAttribute('disabled');
          
          // For select elements, also check if options are loaded (more than just placeholder)
          if (element instanceof HTMLSelectElement) {
            const options = Array.from(element.options);
            // Check if we have real options (not just "Select Period" or "Select Year")
            const hasRealOptions = options.length > 1 || 
              (options.length === 1 && 
               options[0].value !== '' && 
               options[0].text !== 'Select Period' && 
               options[0].text !== 'Select Year' &&
               !options[0].text.toLowerCase().includes('select'));
            
            if (isVisible && !isDisabled && hasRealOptions) {
              console.log(`[ExecutionEngine] Wait condition met - element has ${options.length} options`);
              return {
                stepId: step.id,
                success: true,
                message: `Wait condition met - element is available with ${options.length} options loaded`,
                timestamp: new Date().toISOString(),
                duration: Date.now() - startTime,
              };
            }
          } else {
            // For non-select elements, just check visibility
            if (isVisible && !isDisabled) {
              return {
                stepId: step.id,
                success: true,
                message: 'Wait condition met - element is available',
                timestamp: new Date().toISOString(),
                duration: Date.now() - startTime,
              };
            }
          }
        }
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        elapsed += checkInterval;
      }

      // Final check - even if timeout, check if we have options now
      const element = document.querySelector(step.target);
      if (element instanceof HTMLSelectElement) {
        const options = Array.from(element.options);
        const hasRealOptions = options.length > 1 || 
          (options.length === 1 && 
           options[0].value !== '' && 
           options[0].text !== 'Select Period' && 
           options[0].text !== 'Select Year');
        
        if (hasRealOptions) {
          return {
            stepId: step.id,
            success: true,
            message: `Element found with ${options.length} options (timeout but options available)`,
            timestamp: new Date().toISOString(),
            duration: Date.now() - startTime,
          };
        }
      } else if (element) {
        return {
          stepId: step.id,
          success: true,
          message: 'Element found (may not be visible)',
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
        };
      }

      return {
        stepId: step.id,
        success: false,
        message: `Wait timeout: element not found or API data not loaded - ${step.target}`,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        stepId: step.id,
        success: false,
        message: `Wait error: ${error.message}`,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      };
    }
  }

  private static async executeValidate(step: ActionStep, startTime: number): Promise<ExecutionResult> {
    if (step.validation) {
      const isValid = step.validation();
      return {
        stepId: step.id,
        success: isValid,
        message: isValid ? 'Validation passed' : 'Validation failed',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      };
    }

    return {
      stepId: step.id,
      success: true,
      message: 'Validation skipped',
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    };
  }

  private static async executeConfirm(step: ActionStep, startTime: number): Promise<ExecutionResult> {
    // This should trigger a confirmation dialog
    // For now, return success (actual confirmation handled by UI)
    return {
      stepId: step.id,
      success: true,
      message: 'Confirmation required',
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    };
  }

  static async executePlan(steps: ActionStep[], onProgress?: (result: ExecutionResult) => void): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];

    for (const step of steps) {
      // Skip confirmation steps (handled by UI)
      if (step.type === 'confirm') {
        continue;
      }

      const result = await this.executeStep(step);
      results.push(result);
      
      if (onProgress) {
        onProgress(result);
      }

      // If step failed, stop execution
      if (!result.success) {
        toast.error(`Step failed: ${result.message}`);
        break;
      }

      // Small delay between steps for visual feedback
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
  }
}

export default ExecutionEngine;

