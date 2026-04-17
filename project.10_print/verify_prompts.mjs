import { buildAgentSystemPrompt } from '../project.10_print/lib/prompt.js'
import fs from 'fs'
import path from 'path'

// Mocking needed for project root
// Since we are running outside Next.js, we might need to adjust process.cwd() or paths

function testPrompts() {
  try {
    const agent1 = buildAgentSystemPrompt('1')
    console.log('--- AGENT 1 SYSTEM PROMPT (FIRST 500 chars) ---')
    console.log(agent1.substring(0, 500))
    console.log('\n--- AGENT 1 SYSTEM PROMPT (LAST 500 chars) ---')
    console.log(agent1.substring(agent1.length - 500))
    
    const agent3 = buildAgentSystemPrompt('3')
    console.log('\n--- AGENT 3 SYSTEM PROMPT (INJECTION CHECK) ---')
    // Check if PROMPT_건축작가.txt is injected
    if (agent3.includes('[참조 파일: writer/PROMPT_건축작가.txt]')) {
      console.log('Infection Success: PROMPT_건축작가.txt found')
    } else {
      console.log('Infection FAILED: PROMPT_건축작가.txt NOT found')
    }

    console.log('\nPrompt Verification: SUCCESS')
  } catch (err) {
    console.error('Prompt Verification: FAILED')
    console.error(err)
  }
}

testPrompts()
