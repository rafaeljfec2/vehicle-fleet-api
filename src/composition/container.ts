import {
  createAutomobileController,
  type AutomobileController,
} from '../modules/automobiles/automobile.controller.js';
import {
  createInMemoryAutomobileRepository,
  type AutomobileRepository,
} from '../modules/automobiles/automobile.repository.js';
import {
  createAutomobileService,
  type AutomobileService,
} from '../modules/automobiles/automobile.service.js';
import {
  createDriverController,
  type DriverController,
} from '../modules/drivers/driver.controller.js';
import {
  createInMemoryDriverRepository,
  type DriverRepository,
} from '../modules/drivers/driver.repository.js';
import {
  createDriverService,
  type DriverService,
} from '../modules/drivers/driver.service.js';
import {
  createUsageController,
  type UsageController,
} from '../modules/usages/usage.controller.js';
import {
  createInMemoryUsageRepository,
  type UsageRepository,
} from '../modules/usages/usage.repository.js';
import {
  createUsageService,
  type UsageService,
} from '../modules/usages/usage.service.js';

export type AppContainer = Readonly<{
  automobileRepository: AutomobileRepository;
  driverRepository: DriverRepository;
  usageRepository: UsageRepository;
  automobileService: AutomobileService;
  driverService: DriverService;
  usageService: UsageService;
  automobileController: AutomobileController;
  driverController: DriverController;
  usageController: UsageController;
}>;

export function createContainer(): AppContainer {
  const automobileRepository = createInMemoryAutomobileRepository();
  const driverRepository = createInMemoryDriverRepository();
  const usageRepository = createInMemoryUsageRepository();

  const automobileService = createAutomobileService(
    automobileRepository,
    usageRepository,
  );
  const driverService = createDriverService(driverRepository, usageRepository);
  const usageService = createUsageService(
    usageRepository,
    automobileRepository,
    driverRepository,
  );

  return {
    automobileRepository,
    driverRepository,
    usageRepository,
    automobileService,
    driverService,
    usageService,
    automobileController: createAutomobileController(automobileService),
    driverController: createDriverController(driverService),
    usageController: createUsageController(usageService),
  };
}
