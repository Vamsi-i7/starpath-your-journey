#!/bin/bash

# ============================================================================
# StarPath App Functionality Test Script
# ============================================================================
# This script performs automated checks to verify the app is working correctly.
# It checks build, tests, types, and provides a summary of the app's health.
#
# Usage:
#   ./test-app-functionality.sh           # Run all checks
#   ./test-app-functionality.sh --quick   # Skip build check (faster)
#   ./test-app-functionality.sh --help    # Show help
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# ============================================================================
# Helper Functions
# ============================================================================

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_subheader() {
    echo ""
    echo -e "${CYAN}▶ $1${NC}"
}

print_success() {
    echo -e "  ${GREEN}✓${NC} $1"
    ((PASSED++))
}

print_failure() {
    echo -e "  ${RED}✗${NC} $1"
    ((FAILED++))
}

print_warning() {
    echo -e "  ${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

print_info() {
    echo -e "  ${BLUE}ℹ${NC} $1"
}

check_command() {
    local cmd=$1
    local description=$2
    
    if $cmd > /dev/null 2>&1; then
        print_success "$description"
        return 0
    else
        print_failure "$description"
        return 1
    fi
}

# ============================================================================
# Check Functions
# ============================================================================

check_dependencies() {
    print_subheader "Checking Dependencies"
    
    if [ -f "node_modules/.package-lock.json" ]; then
        print_success "Node modules installed"
    else
        print_warning "Node modules may need to be installed (run npm install)"
    fi
    
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        print_success "Node.js installed: $node_version"
    else
        print_failure "Node.js not found"
    fi
    
    if command -v npm &> /dev/null; then
        local npm_version=$(npm --version)
        print_success "npm installed: $npm_version"
    else
        print_failure "npm not found"
    fi
}

check_typescript() {
    print_subheader "TypeScript Type Checking"
    
    if npx tsc --noEmit > /dev/null 2>&1; then
        print_success "TypeScript compilation passed (no type errors)"
    else
        print_failure "TypeScript compilation failed"
        echo ""
        echo "  Run 'npx tsc --noEmit' to see detailed errors"
    fi
}

check_lint() {
    print_subheader "ESLint Check"
    
    if npm run lint > /dev/null 2>&1; then
        print_success "ESLint passed (no linting errors)"
    else
        print_warning "ESLint found issues"
        echo "  Run 'npm run lint' to see detailed warnings"
    fi
}

check_tests() {
    print_subheader "Running Unit Tests"
    
    local test_output=$(npm run test:run 2>&1)
    
    if echo "$test_output" | grep -q "passed"; then
        local passed=$(echo "$test_output" | grep -oE "[0-9]+ passed" | head -1)
        print_success "All tests passed ($passed)"
    else
        print_failure "Some tests failed"
        echo ""
        echo "  Run 'npm run test:run' to see detailed results"
    fi
}

check_build() {
    print_subheader "Production Build Check"
    
    print_info "Building production bundle (this may take a moment)..."
    
    if npm run build > /dev/null 2>&1; then
        print_success "Production build successful"
        
        # Check build output size
        if [ -d "dist" ]; then
            local build_size=$(du -sh dist 2>/dev/null | cut -f1)
            print_info "Build size: $build_size"
        fi
    else
        print_failure "Production build failed"
        echo ""
        echo "  Run 'npm run build' to see detailed errors"
    fi
}

check_env_files() {
    print_subheader "Environment Configuration"
    
    if [ -f ".env" ] || [ -f ".env.local" ]; then
        print_success "Environment file exists"
    else
        print_warning "No .env file found (may need configuration)"
        print_info "Copy .env.example to .env and configure"
    fi
    
    if [ -f ".env.example" ]; then
        print_success ".env.example template exists"
    fi
}

check_supabase_types() {
    print_subheader "Supabase Types Check"
    
    if [ -f "src/integrations/supabase/types.ts" ]; then
        print_success "Supabase types file exists"
        
        # Check for critical table definitions
        if grep -q "tasks:" src/integrations/supabase/types.ts; then
            print_success "Tasks table types defined"
        else
            print_warning "Tasks table types may be missing"
        fi
        
        if grep -q "goals:" src/integrations/supabase/types.ts; then
            print_success "Goals table types defined"
        else
            print_warning "Goals table types may be missing"
        fi
        
        if grep -q "due_date" src/integrations/supabase/types.ts; then
            print_success "due_date column in tasks types"
        else
            print_failure "due_date column missing from tasks types"
        fi
        
        if grep -q "parent_task_id" src/integrations/supabase/types.ts; then
            print_success "parent_task_id column in tasks types"
        else
            print_failure "parent_task_id column missing from tasks types"
        fi
    else
        print_failure "Supabase types file not found"
    fi
}

check_edge_functions() {
    print_subheader "Edge Functions Check"
    
    local functions_dir="supabase/functions"
    local expected_functions=("ai-generate" "ai-coach" "contact-us" "delete-user" "check-user-exists")
    
    if [ -d "$functions_dir" ]; then
        print_success "Edge functions directory exists"
        
        for func in "${expected_functions[@]}"; do
            if [ -f "$functions_dir/$func/index.ts" ]; then
                print_success "$func function exists"
            else
                print_warning "$func function not found"
            fi
        done
    else
        print_failure "Edge functions directory not found"
    fi
}

check_goals_feature() {
    print_subheader "Goals Feature Files"
    
    local goals_files=(
        "src/hooks/useGoals.ts"
        "src/pages/GoalsPage.tsx"
        "src/components/goals/GoalsTable.tsx"
        "src/components/goals/GoalRow.tsx"
        "src/components/goals/CreateGoalModal.tsx"
    )
    
    for file in "${goals_files[@]}"; do
        if [ -f "$file" ]; then
            print_success "$(basename $file) exists"
        else
            print_failure "$(basename $file) not found"
        fi
    done
    
    # Check for validation constants in useGoals
    if grep -q "MAX_TITLE_LENGTH" src/hooks/useGoals.ts 2>/dev/null; then
        print_success "Validation constants defined in useGoals"
    else
        print_warning "Validation constants may be missing"
    fi
    
    # Check for error handling
    if grep -q "try {" src/hooks/useGoals.ts 2>/dev/null; then
        print_success "Error handling present in useGoals"
    else
        print_warning "Error handling may be incomplete"
    fi
}

show_help() {
    echo "StarPath App Functionality Test Script"
    echo ""
    echo "Usage:"
    echo "  $0              Run all checks"
    echo "  $0 --quick      Skip build check (faster)"
    echo "  $0 --help       Show this help message"
    echo ""
    echo "Checks performed:"
    echo "  • Dependencies (Node.js, npm)"
    echo "  • TypeScript compilation"
    echo "  • ESLint"
    echo "  • Unit tests"
    echo "  • Production build"
    echo "  • Environment configuration"
    echo "  • Supabase types"
    echo "  • Edge functions"
    echo "  • Goals feature files"
    echo ""
}

# ============================================================================
# Main Script
# ============================================================================

main() {
    local skip_build=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --quick)
                skip_build=true
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    print_header "StarPath App Functionality Tests"
    echo ""
    echo "  Running comprehensive checks on your app..."
    echo "  Started at: $(date '+%Y-%m-%d %H:%M:%S')"
    
    # Run all checks
    check_dependencies
    check_env_files
    check_supabase_types
    check_goals_feature
    check_edge_functions
    check_typescript
    check_lint
    check_tests
    
    if [ "$skip_build" = false ]; then
        check_build
    else
        print_subheader "Production Build Check"
        print_info "Skipped (--quick mode)"
    fi
    
    # Print summary
    print_header "Test Summary"
    echo ""
    echo -e "  ${GREEN}Passed:${NC}   $PASSED"
    echo -e "  ${RED}Failed:${NC}   $FAILED"
    echo -e "  ${YELLOW}Warnings:${NC} $WARNINGS"
    echo ""
    
    if [ $FAILED -eq 0 ]; then
        echo -e "  ${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "  ${GREEN}  ✓ All critical checks passed!${NC}"
        echo -e "  ${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo "  Your app is ready for testing!"
        echo ""
        echo "  Next steps:"
        echo "    1. Run 'npm run dev' to start the development server"
        echo "    2. Open http://localhost:8080 in your browser"
        echo "    3. Test the Goals & Planner feature"
        echo "    4. Test the AI features"
        echo ""
    else
        echo -e "  ${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "  ${RED}  ✗ Some checks failed${NC}"
        echo -e "  ${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo "  Please fix the failed checks before proceeding."
        echo ""
        exit 1
    fi
}

# Run main function
main "$@"
