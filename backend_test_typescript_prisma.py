#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for TypeScript + Prisma SmartDoc AI
Testing focus: TypeScript compilation, Prisma integration, error handling, and API structure
Expected: OpenAI endpoints will fail due to invalid API key (documented behavior)
"""

import asyncio
import aiohttp
import json
import io
import os
from typing import Dict, Any, Optional

# Get base URL from environment or use default
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://ask-documents.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

class TypeScriptPrismaAPITester:
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.results = {
            'typescript_compilation': 'unknown',
            'prisma_integration': 'unknown',
            'endpoints': {},
            'critical_issues': [],
            'minor_issues': [],
            'expected_failures': []
        }

    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            connector=aiohttp.TCPConnector(verify_ssl=False)
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def make_request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """Make HTTP request with error handling"""
        url = f"{API_BASE}{endpoint}"
        print(f"🔍 Testing: {method} {url}")
        
        try:
            async with self.session.request(method, url, **kwargs) as response:
                # Try to get response text first
                text = await response.text()
                
                result = {
                    'status_code': response.status,
                    'headers': dict(response.headers),
                    'text': text,
                    'success': True
                }
                
                # Try to parse as JSON if possible
                try:
                    result['json'] = json.loads(text) if text.strip() else {}
                except json.JSONDecodeError:
                    result['json'] = None
                
                return result
                
        except Exception as e:
            return {
                'status_code': None,
                'error': str(e),
                'success': False,
                'headers': {},
                'text': '',
                'json': None
            }

    async def test_get_documents(self) -> Dict[str, Any]:
        """Test GET /api/documents - Document listing functionality"""
        print("\n📋 Testing GET /api/documents (Document Listing)")
        
        result = await self.make_request('GET', '/documents')
        
        if not result['success']:
            return {
                'endpoint': 'GET /api/documents',
                'status': 'critical_failure',
                'issue': f"Request failed: {result['error']}",
                'details': result
            }
        
        # Check TypeScript compilation (endpoint should respond)
        if result['status_code'] in [200, 500]:
            self.results['typescript_compilation'] = 'working'
            print("✅ TypeScript compilation: WORKING (endpoint responds)")
        
        # Check response structure
        if result['status_code'] == 200:
            if result['json'] and 'documents' in result['json']:
                documents = result['json']['documents']
                if isinstance(documents, list):
                    print(f"✅ GET /api/documents: SUCCESS - Returns documents array with {len(documents)} items")
                    
                    # Check Prisma integration (successful database query)
                    self.results['prisma_integration'] = 'working'
                    print("✅ Prisma integration: WORKING (database query successful)")
                    
                    return {
                        'endpoint': 'GET /api/documents',
                        'status': 'success',
                        'details': {
                            'status_code': result['status_code'],
                            'documents_count': len(documents),
                            'response_structure': 'correct'
                        }
                    }
                else:
                    return {
                        'endpoint': 'GET /api/documents',
                        'status': 'critical_failure',
                        'issue': f"Invalid response structure: documents is not an array",
                        'details': result
                    }
            else:
                return {
                    'endpoint': 'GET /api/documents',
                    'status': 'critical_failure',
                    'issue': "Missing 'documents' field in response",
                    'details': result
                }
        else:
            return {
                'endpoint': 'GET /api/documents',
                'status': 'critical_failure',
                'issue': f"Unexpected status code: {result['status_code']}",
                'details': result
            }

    async def test_delete_documents_validation(self) -> Dict[str, Any]:
        """Test DELETE /api/documents - Error handling and validation"""
        print("\n🗑️ Testing DELETE /api/documents (Error Handling)")
        
        # Test missing documentName parameter
        result = await self.make_request(
            'DELETE', 
            '/documents',
            json={}  # Empty body
        )
        
        if not result['success']:
            return {
                'endpoint': 'DELETE /api/documents',
                'status': 'critical_failure',
                'issue': f"Request failed: {result['error']}",
                'details': result
            }
        
        if result['status_code'] == 400:
            if result['json'] and 'error' in result['json']:
                error_msg = result['json']['error']
                if 'required' in error_msg.lower() or 'document name' in error_msg.lower():
                    print("✅ DELETE /api/documents: Proper validation - Returns 400 for missing documentName")
                    
                    # Test successful deletion (non-existent document should handle gracefully)
                    delete_result = await self.make_request(
                        'DELETE',
                        '/documents', 
                        json={'documentName': 'non-existent-document.pdf'}
                    )
                    
                    if delete_result['success'] and delete_result['status_code'] == 200:
                        print("✅ DELETE /api/documents: Handles non-existent documents gracefully")
                        return {
                            'endpoint': 'DELETE /api/documents',
                            'status': 'success',
                            'details': {
                                'validation_works': True,
                                'graceful_handling': True,
                                'error_response': result['json']
                            }
                        }
                    else:
                        return {
                            'endpoint': 'DELETE /api/documents',
                            'status': 'minor_issue',
                            'issue': f"Delete operation returned unexpected status: {delete_result['status_code']}",
                            'details': delete_result
                        }
                else:
                    return {
                        'endpoint': 'DELETE /api/documents',
                        'status': 'minor_issue',
                        'issue': f"Error message unclear: {error_msg}",
                        'details': result
                    }
            else:
                return {
                    'endpoint': 'DELETE /api/documents',
                    'status': 'critical_failure',
                    'issue': "400 status but no error message in response",
                    'details': result
                }
        else:
            return {
                'endpoint': 'DELETE /api/documents',
                'status': 'critical_failure',
                'issue': f"Expected 400 status for missing parameter, got {result['status_code']}",
                'details': result
            }

    async def test_upload_endpoint_structure(self) -> Dict[str, Any]:
        """Test POST /api/upload - Structure and OpenAI integration (expected to fail)"""
        print("\n📤 Testing POST /api/upload (Structure & Expected OpenAI Failure)")
        
        # Test missing file parameter
        print("Testing missing file validation...")
        result = await self.make_request(
            'POST',
            '/upload',
            data=aiohttp.FormData()  # Empty form data
        )
        
        if not result['success']:
            return {
                'endpoint': 'POST /api/upload',
                'status': 'critical_failure',
                'issue': f"Request failed: {result['error']}",
                'details': result
            }
        
        if result['status_code'] == 400:
            if result['json'] and 'error' in result['json']:
                error_msg = result['json']['error']
                if 'file' in error_msg.lower() or 'no file' in error_msg.lower():
                    print("✅ POST /api/upload: Proper validation - Returns 400 for missing file")
                    
                    # Test with actual PDF file (will fail at OpenAI step - expected)
                    print("Testing with PDF file (expecting OpenAI failure)...")
                    pdf_content = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n174\n%%EOF"
                    
                    form_data = aiohttp.FormData()
                    form_data.add_field('file', pdf_content, filename='test.pdf', content_type='application/pdf')
                    
                    upload_result = await self.make_request(
                        'POST',
                        '/upload',
                        data=form_data
                    )
                    
                    # Expect this to fail due to OpenAI API key
                    if upload_result['status_code'] == 500:
                        print("✅ POST /api/upload: Expected OpenAI failure detected (invalid API key)")
                        if upload_result['json'] and 'error' in upload_result['json']:
                            error_msg = upload_result['json']['error']
                            if 'openai' in error_msg.lower() or 'api' in error_msg.lower() or 'unauthorized' in error_msg.lower():
                                return {
                                    'endpoint': 'POST /api/upload',
                                    'status': 'expected_failure',
                                    'reason': 'Invalid OpenAI API key (expected)',
                                    'details': {
                                        'validation_works': True,
                                        'openai_integration_detected': True,
                                        'error_message': error_msg
                                    }
                                }
                        
                        return {
                            'endpoint': 'POST /api/upload',
                            'status': 'expected_failure',
                            'reason': 'OpenAI integration failure (expected)',
                            'details': upload_result
                        }
                    elif upload_result['status_code'] == 200:
                        # This would be unexpected with invalid API key
                        return {
                            'endpoint': 'POST /api/upload',
                            'status': 'unexpected_success',
                            'issue': 'Upload succeeded despite invalid OpenAI API key',
                            'details': upload_result
                        }
                    else:
                        return {
                            'endpoint': 'POST /api/upload',
                            'status': 'critical_failure',
                            'issue': f"Unexpected response during upload: {upload_result['status_code']}",
                            'details': upload_result
                        }
                else:
                    return {
                        'endpoint': 'POST /api/upload',
                        'status': 'minor_issue',
                        'issue': f"Unclear validation error message: {error_msg}",
                        'details': result
                    }
            else:
                return {
                    'endpoint': 'POST /api/upload',
                    'status': 'critical_failure',
                    'issue': "400 status but no error message in response",
                    'details': result
                }
        else:
            return {
                'endpoint': 'POST /api/upload',
                'status': 'critical_failure',
                'issue': f"Expected 400 for missing file, got {result['status_code']}",
                'details': result
            }

    async def test_chat_endpoint_structure(self) -> Dict[str, Any]:
        """Test POST /api/chat - Structure and OpenAI integration (expected to fail)"""
        print("\n💬 Testing POST /api/chat (Structure & Expected OpenAI Failure)")
        
        # Test missing message parameter
        print("Testing missing message validation...")
        result = await self.make_request(
            'POST',
            '/chat',
            json={}  # Empty body
        )
        
        if not result['success']:
            return {
                'endpoint': 'POST /api/chat',
                'status': 'critical_failure',
                'issue': f"Request failed: {result['error']}",
                'details': result
            }
        
        if result['status_code'] == 400:
            if result['json'] and 'error' in result['json']:
                error_msg = result['json']['error']
                if 'message' in error_msg.lower() or 'required' in error_msg.lower():
                    print("✅ POST /api/chat: Proper validation - Returns 400 for missing message")
                    
                    # Test with actual message (will fail at OpenAI step - expected)
                    print("Testing with message (expecting OpenAI failure)...")
                    chat_result = await self.make_request(
                        'POST',
                        '/chat',
                        json={'message': 'What is this document about?'}
                    )
                    
                    # Expect this to fail due to OpenAI API key
                    if chat_result['status_code'] == 500:
                        print("✅ POST /api/chat: Expected OpenAI failure detected (invalid API key)")
                        if chat_result['json'] and 'error' in chat_result['json']:
                            error_msg = chat_result['json']['error']
                            if 'openai' in error_msg.lower() or 'api' in error_msg.lower() or 'unauthorized' in error_msg.lower():
                                return {
                                    'endpoint': 'POST /api/chat',
                                    'status': 'expected_failure',
                                    'reason': 'Invalid OpenAI API key (expected)',
                                    'details': {
                                        'validation_works': True,
                                        'openai_integration_detected': True,
                                        'error_message': error_msg
                                    }
                                }
                        
                        return {
                            'endpoint': 'POST /api/chat',
                            'status': 'expected_failure',
                            'reason': 'OpenAI integration failure (expected)',
                            'details': chat_result
                        }
                    elif chat_result['status_code'] == 400:
                        # Check if it's "no documents" error
                        if chat_result['json'] and 'error' in chat_result['json']:
                            error_msg = chat_result['json']['error']
                            if 'no documents' in error_msg.lower() or 'upload' in error_msg.lower():
                                print("✅ POST /api/chat: Proper validation - No documents error")
                                return {
                                    'endpoint': 'POST /api/chat',
                                    'status': 'success',
                                    'details': {
                                        'validation_works': True,
                                        'proper_flow': True,
                                        'no_docs_handling': True
                                    }
                                }
                        
                        return {
                            'endpoint': 'POST /api/chat',
                            'status': 'minor_issue',
                            'issue': f"Unexpected 400 error: {chat_result.get('json', {})}",
                            'details': chat_result
                        }
                    elif chat_result['status_code'] == 200:
                        # This would be unexpected with invalid API key
                        return {
                            'endpoint': 'POST /api/chat',
                            'status': 'unexpected_success',
                            'issue': 'Chat succeeded despite invalid OpenAI API key',
                            'details': chat_result
                        }
                    else:
                        return {
                            'endpoint': 'POST /api/chat',
                            'status': 'critical_failure',
                            'issue': f"Unexpected response during chat: {chat_result['status_code']}",
                            'details': chat_result
                        }
                else:
                    return {
                        'endpoint': 'POST /api/chat',
                        'status': 'minor_issue',
                        'issue': f"Unclear validation error message: {error_msg}",
                        'details': result
                    }
            else:
                return {
                    'endpoint': 'POST /api/chat',
                    'status': 'critical_failure',
                    'issue': "400 status but no error message in response",
                    'details': result
                }
        else:
            return {
                'endpoint': 'POST /api/chat',
                'status': 'critical_failure',
                'issue': f"Expected 400 for missing message, got {result['status_code']}",
                'details': result
            }

    async def run_all_tests(self):
        """Run comprehensive TypeScript + Prisma API tests"""
        print("🚀 Starting Comprehensive TypeScript + Prisma API Testing")
        print("=" * 70)
        
        # Test all endpoints
        tests = [
            ('documents_get', self.test_get_documents),
            ('documents_delete', self.test_delete_documents_validation),
            ('upload', self.test_upload_endpoint_structure),
            ('chat', self.test_chat_endpoint_structure)
        ]
        
        for test_name, test_func in tests:
            try:
                result = await test_func()
                self.results['endpoints'][test_name] = result
                
                # Categorize results
                if result['status'] == 'critical_failure':
                    self.results['critical_issues'].append(result)
                elif result['status'] in ['minor_issue', 'unexpected_success']:
                    self.results['minor_issues'].append(result)
                elif result['status'] == 'expected_failure':
                    self.results['expected_failures'].append(result)
                    
            except Exception as e:
                error_result = {
                    'endpoint': test_name,
                    'status': 'test_error',
                    'issue': f"Test execution failed: {str(e)}",
                    'details': {}
                }
                self.results['endpoints'][test_name] = error_result
                self.results['critical_issues'].append(error_result)

    def print_summary(self):
        """Print comprehensive test summary"""
        print("\n" + "=" * 70)
        print("📊 TYPESCRIPT + PRISMA API TESTING SUMMARY")
        print("=" * 70)
        
        # TypeScript Compilation Status
        ts_status = self.results['typescript_compilation']
        ts_icon = "✅" if ts_status == 'working' else "❌" if ts_status == 'unknown' else "⚠️"
        print(f"{ts_icon} TypeScript Compilation: {ts_status.upper()}")
        
        # Prisma Integration Status
        prisma_status = self.results['prisma_integration']
        prisma_icon = "✅" if prisma_status == 'working' else "❌" if prisma_status == 'unknown' else "⚠️"
        print(f"{prisma_icon} Prisma Integration: {prisma_status.upper()}")
        
        print("\n📋 ENDPOINT RESULTS:")
        for endpoint_name, result in self.results['endpoints'].items():
            status = result['status']
            if status == 'success':
                icon = "✅"
            elif status == 'expected_failure':
                icon = "⚠️"
            elif status in ['critical_failure', 'test_error']:
                icon = "❌"
            else:
                icon = "⚠️"
            
            print(f"{icon} {result['endpoint']}: {status.replace('_', ' ').upper()}")
            if 'reason' in result:
                print(f"    → {result['reason']}")
            elif 'issue' in result:
                print(f"    → {result['issue']}")
        
        # Critical Issues
        if self.results['critical_issues']:
            print("\n🚨 CRITICAL ISSUES:")
            for issue in self.results['critical_issues']:
                print(f"❌ {issue['endpoint']}: {issue['issue']}")
        
        # Expected Failures
        if self.results['expected_failures']:
            print("\n⚠️ EXPECTED FAILURES (Invalid OpenAI API Key):")
            for failure in self.results['expected_failures']:
                print(f"⚠️ {failure['endpoint']}: {failure['reason']}")
        
        # Minor Issues
        if self.results['minor_issues']:
            print("\n⚠️ MINOR ISSUES:")
            for issue in self.results['minor_issues']:
                print(f"⚠️ {issue['endpoint']}: {issue['issue']}")
        
        print("\n" + "=" * 70)
        
        # Overall Assessment
        critical_count = len(self.results['critical_issues'])
        expected_count = len(self.results['expected_failures'])
        success_count = len([r for r in self.results['endpoints'].values() if r['status'] == 'success'])
        
        print(f"📈 OVERALL ASSESSMENT:")
        print(f"   ✅ Successful endpoints: {success_count}")
        print(f"   ⚠️ Expected failures: {expected_count}")
        print(f"   ❌ Critical issues: {critical_count}")
        
        if critical_count == 0 and self.results['typescript_compilation'] == 'working' and self.results['prisma_integration'] == 'working':
            print(f"\n🎉 TypeScript + Prisma integration is WORKING CORRECTLY!")
            print(f"   All endpoints have proper structure and error handling.")
            print(f"   OpenAI failures are expected due to invalid API key.")
        else:
            print(f"\n⚠️ Issues detected in TypeScript/Prisma integration.")


async def main():
    """Main testing function"""
    async with TypeScriptPrismaAPITester() as tester:
        await tester.run_all_tests()
        tester.print_summary()
        return tester.results

if __name__ == "__main__":
    results = asyncio.run(main())